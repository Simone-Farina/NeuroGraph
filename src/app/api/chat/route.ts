import { convertToModelMessages, streamText, UIMessage } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAuthenticatedUser } from '@/lib/auth/server';
import { CHAT_SYSTEM_PROMPT, MAX_CONTEXT_MESSAGES } from '@/lib/ai/prompts';
import { getChatModel } from '@/lib/ai/providers';
import { suggestCrystallizationTool } from '@/lib/ai/tools';

import { getRelevantContext } from '@/lib/ai/rag';
import { persistAssistantMessage } from './persistence';

function createConversationTitle(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return 'Untitled Conversation';
  if (trimmed.length <= 60) return trimmed;
  return `${trimmed.slice(0, 57)}...`;
}

export async function GET(request: NextRequest) {
  try {
    const { user, supabase, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

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

const postSchema = z.object({
  conversationId: z.string().uuid().optional(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system', 'tool']),
      content: z.string().optional(),
      parts: z.array(z.any()).optional(),
    }).passthrough()
  ).min(1),
}).passthrough();

export async function POST(request: NextRequest) {
  try {
    const { user, supabase, errorResponse } = await getAuthenticatedUser();
    if (errorResponse) return errorResponse;

    // Rate limiting check
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit');

    if (rateLimitError) {
      console.error('Rate limit error:', rateLimitError);
      return NextResponse.json({ error: 'Rate limit check failed' }, { status: 500 });
    }

    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // Rate limiting check
    const { data: allowed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_limit: 20, // 20 requests
      p_window_seconds: 60, // per 60 seconds
    });

    if (rateLimitError) {
      console.error('Rate limit error:', rateLimitError);
      return NextResponse.json({ error: 'Rate limit check failed' }, { status: 500 });
    }

    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const uiMessages = parsed.data.messages as unknown as UIMessage[];
    const trimmedMessages = uiMessages.slice(-MAX_CONTEXT_MESSAGES);

    // Find the latest user message text for conversation title & DB persistence
    const latestUserMessage = [...trimmedMessages]
      .reverse()
      .find((m) => m.role === 'user');

    const latestUserText = latestUserMessage?.parts
      ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join(' ')
      .trim();

    if (!latestUserText) {
      return NextResponse.json({ error: 'A user message is required' }, { status: 400 });
    }

    let conversationId = parsed.data.conversationId;

    if (!conversationId) {
      const { data: createdConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
          title: createConversationTitle(latestUserText),
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

    // Persist the user message
    const { error: insertUserMessageError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: latestUserText,
    });

    if (insertUserMessageError) {
      return NextResponse.json({ error: insertUserMessageError.message }, { status: 500 });
    }

    const { ragContext, ragCatalog } = await getRelevantContext(latestUserText, user.id, supabase);

    const systemPrompt = `${CHAT_SYSTEM_PROMPT}${ragContext}\n\n## Existing Crystal Catalog\nUse this catalog to populate related_crystals when suggesting crystallization.\nOnly use ids from this list:\n${ragCatalog}`;

    const model = getChatModel();

    const modelMessages = await convertToModelMessages(trimmedMessages);

    let assistantText = '';
    const response = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      tools: {
        suggest_crystallization: suggestCrystallizationTool,
      },
      onChunk(event) {
        if (event.chunk.type === 'text-delta') {
          assistantText += event.chunk.text;
        }
      },
      onFinish: async () => {
        if (!conversationId) return;
        await persistAssistantMessage(supabase, conversationId, assistantText);
      },
    });

    return response.toUIMessageStreamResponse({
      headers: {
        'X-Conversation-Id': conversationId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
