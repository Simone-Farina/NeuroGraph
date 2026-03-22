import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { generateCrystallizeSeed } from '@/lib/crystallize/seed';
import type {
  CrystallizeMetadata,
  ManualCrystallizeRequest,
} from '@/lib/crystallize/types';
import { queueQueries } from '@/lib/db/queueQueries';

export const runtime = 'nodejs';

const requestSchema = z.object({
  conversationId: z.string().uuid(),
  queueItemId: z.string().uuid(),
  pastedText: z.string().refine((value) => value.trim().length >= 500, {
    message: 'Pasted text must be at least 500 characters long',
  }),
}) satisfies z.ZodType<ManualCrystallizeRequest>;

function buildCrystallizeMetadata(input: {
  queueItemId: string;
  sourceTitle: string;
  sourceUrl: string | null;
  sourceDomain: string | null;
  notesPresent: boolean;
}): CrystallizeMetadata {
  return {
    crystallize: {
      queue_item_id: input.queueItemId,
      source_title: input.sourceTitle,
      source_url: input.sourceUrl,
      source_domain: input.sourceDomain,
      status: 'seeded',
      notes_present: input.notesPresent,
    },
  };
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

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { conversationId, queueItemId, pastedText } = parsed.data;
    const trimmedText = pastedText.trim();

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, user_id')
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const queueItem = await queueQueries.getById(supabase, queueItemId);
    if (!queueItem || queueItem.user_id !== user.id) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
    }

    const { error: markerError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'user',
      content: 'Source material pasted for crystallization.',
      metadata: {
        queue_item_id: queueItem.id,
        pasted_characters: trimmedText.length,
      },
    });

    if (markerError) {
      throw new Error(markerError.message);
    }

    const seed = await generateCrystallizeSeed({
      sourceTitle: queueItem.title,
      sourceUrl: queueItem.url,
      sourceDomain: queueItem.source_domain,
      sourceText: trimmedText,
      notes: queueItem.notes,
    });

    const { error: assistantError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: seed.assistantMessage,
      metadata: buildCrystallizeMetadata({
        queueItemId: queueItem.id,
        sourceTitle: queueItem.title,
        sourceUrl: queueItem.url,
        sourceDomain: queueItem.source_domain,
        notesPresent: Boolean(queueItem.notes?.trim()),
      }),
    });

    if (assistantError) {
      throw new Error(assistantError.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[crystallize] manual continuation failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
