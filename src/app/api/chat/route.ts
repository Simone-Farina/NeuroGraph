import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { CHAT_SYSTEM_PROMPT, MAX_CONTEXT_MESSAGES } from '@/lib/ai/prompts';
import { getChatModel } from '@/lib/ai/providers';

const messageSchema = z.object({
  id: z.string().optional(),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1),
});

const postSchema = z.object({
  conversationId: z.string().uuid().optional(),
  messages: z.array(messageSchema).min(1),
});

function createConversationTitle(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return 'Untitled Conversation';
  if (trimmed.length <= 60) return trimmed;
  return `${trimmed.slice(0, 57)}...`;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mode = request.nextUrl.searchParams.get('mode');

    if (mode === 'messages') {
      const conversationId = request.nextUrl.searchParams.get('conversationId');
      if (!conversationId) {
        return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
      }

      const { data, error } = await supabase
        .from('messages')
        .select('id, role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const messages = (data || [])
        .filter((message) => message.role === 'user' || message.role === 'assistant')
        .map((message) => ({
          id: message.id,
          role: message.role,
          content: message.content,
        }));

      return NextResponse.json({ messages });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversations: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = postSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const incomingMessages = parsed.data.messages.slice(-MAX_CONTEXT_MESSAGES);
    const latestUserMessage = [...incomingMessages].reverse().find((m) => m.role === 'user');

    if (!latestUserMessage) {
      return NextResponse.json({ error: 'A user message is required' }, { status: 400 });
    }

    let conversationId = parsed.data.conversationId;

    if (!conversationId) {
      const { data: createdConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: createConversationTitle(latestUserMessage.content),
        })
        .select('id')
        .single();

      if (conversationError || !createdConversation) {
        return NextResponse.json(
          { error: conversationError?.message ?? 'Failed to create conversation' },
          { status: 500 }
        );
      }

      conversationId = createdConversation.id;
    }

    const { error: insertUserMessageError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: latestUserMessage.content,
    });

    if (insertUserMessageError) {
      return NextResponse.json({ error: insertUserMessageError.message }, { status: 500 });
    }

    const model = getChatModel();

    const modelMessages = await convertToModelMessages(
      incomingMessages.map((message) => ({
        role: message.role,
        parts: [{ type: 'text', text: message.content }],
      })) as Array<Omit<UIMessage, 'id'>>
    );

    let assistantText = '';
    const response = streamText({
      model,
      system: CHAT_SYSTEM_PROMPT,
      messages: modelMessages,
      onChunk(event) {
        if (event.chunk.type === 'text-delta') {
          assistantText += event.chunk.text;
        }
      },
      onFinish: async () => {
        if (!assistantText.trim() || !conversationId) return;

        await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantText,
        });
      },
    });

    return response.toTextStreamResponse({
      headers: {
        'X-Conversation-Id': conversationId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
