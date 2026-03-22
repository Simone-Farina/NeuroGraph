import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import {
  classifyExtractionFailure,
  extractCrystallizeSource,
} from '@/lib/crystallize/article';
import { generateCrystallizeSeed } from '@/lib/crystallize/seed';
import type {
  CrystallizeFailureReason,
  CrystallizeMetadata,
  StartCrystallizeRequest,
} from '@/lib/crystallize/types';
import { queueQueries } from '@/lib/db/queueQueries';

export const runtime = 'nodejs';

const requestSchema = z.object({
  queueItemId: z.string().uuid(),
}) satisfies z.ZodType<StartCrystallizeRequest>;

function createConversationTitle(title: string) {
  return `Crystallize: ${title.trim().slice(0, 80)}`;
}

function buildCrystallizeMetadata(input: {
  queueItemId: string;
  sourceTitle: string;
  sourceUrl: string | null;
  sourceDomain: string | null;
  status: 'seeded' | 'awaiting_manual_paste';
  notesPresent: boolean;
  failureReason?: CrystallizeFailureReason;
}): CrystallizeMetadata {
  return {
    crystallize: {
      queue_item_id: input.queueItemId,
      source_title: input.sourceTitle,
      source_url: input.sourceUrl,
      source_domain: input.sourceDomain,
      status: input.status,
      failure_reason: input.failureReason,
      notes_present: input.notesPresent,
    },
  };
}

function createFallbackMessage(input: {
  sourceTitle: string;
  sourceDomain: string | null;
  sourceUrl: string | null;
  reason: CrystallizeFailureReason;
}) {
  const sourceLine = input.sourceDomain ?? input.sourceUrl ?? 'Manual paste required';

  return [
    input.sourceTitle,
    sourceLine,
    '',
    `I couldn't extract enough usable source material automatically (${input.reason}).`,
    '',
    'Question: Paste the source text into this conversation so we can continue from the same queue item.',
  ].join('\n');
}

async function createConversation(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string,
  title: string
) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title: createConversationTitle(title),
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create conversation');
  }

  return data.id;
}

async function insertAssistantMessage(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  input: {
    conversationId: string;
    content: string;
    metadata: CrystallizeMetadata;
  }
) {
  const { error } = await supabase.from('messages').insert({
    conversation_id: input.conversationId,
    role: 'assistant',
    content: input.content,
    metadata: input.metadata,
  });

  if (error) {
    throw new Error(error.message);
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

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const queueItem = await queueQueries.getById(supabase, parsed.data.queueItemId);
    if (!queueItem || queueItem.user_id !== user.id) {
      return NextResponse.json({ error: 'Queue item not found' }, { status: 404 });
    }

    const conversationId = await createConversation(supabase, user.id, queueItem.title);
    const notesPresent = Boolean(queueItem.notes?.trim());

    if (!queueItem.url) {
      const metadata = buildCrystallizeMetadata({
        queueItemId: queueItem.id,
        sourceTitle: queueItem.title,
        sourceUrl: null,
        sourceDomain: queueItem.source_domain,
        status: 'awaiting_manual_paste',
        failureReason: 'missing_url',
        notesPresent,
      });

      await insertAssistantMessage(supabase, {
        conversationId,
        content: createFallbackMessage({
          sourceTitle: queueItem.title,
          sourceDomain: queueItem.source_domain,
          sourceUrl: null,
          reason: 'missing_url',
        }),
        metadata,
      });

      return NextResponse.json({
        conversationId,
        queueItemId: queueItem.id,
        mode: 'awaiting_manual_paste',
        reason: 'missing_url',
      });
    }

    try {
      const extracted = await extractCrystallizeSource(queueItem.url);

      if (!extracted.content || extracted.content.length < 400) {
        const reason = classifyExtractionFailure({ content: extracted.content });
        const metadata = buildCrystallizeMetadata({
          queueItemId: queueItem.id,
          sourceTitle: extracted.title ?? queueItem.title,
          sourceUrl: extracted.url,
          sourceDomain: extracted.domain,
          status: 'awaiting_manual_paste',
          failureReason: reason,
          notesPresent,
        });

        await insertAssistantMessage(supabase, {
          conversationId,
          content: createFallbackMessage({
            sourceTitle: extracted.title ?? queueItem.title,
            sourceDomain: extracted.domain,
            sourceUrl: extracted.url,
            reason,
          }),
          metadata,
        });

        return NextResponse.json({
          conversationId,
          queueItemId: queueItem.id,
          mode: 'awaiting_manual_paste',
          reason,
        });
      }

      const sourceTitle = extracted.title ?? queueItem.title;
      const seed = await generateCrystallizeSeed({
        sourceTitle,
        sourceUrl: extracted.url,
        sourceDomain: extracted.domain,
        sourceText: extracted.content,
        notes: queueItem.notes,
      });

      await insertAssistantMessage(supabase, {
        conversationId,
        content: seed.assistantMessage,
        metadata: buildCrystallizeMetadata({
          queueItemId: queueItem.id,
          sourceTitle,
          sourceUrl: extracted.url,
          sourceDomain: extracted.domain,
          status: 'seeded',
          notesPresent,
        }),
      });

      return NextResponse.json({
        conversationId,
        queueItemId: queueItem.id,
        mode: 'seeded',
      });
    } catch (error) {
      const reason = classifyExtractionFailure({ error });
      const metadata = buildCrystallizeMetadata({
        queueItemId: queueItem.id,
        sourceTitle: queueItem.title,
        sourceUrl: queueItem.url,
        sourceDomain: queueItem.source_domain,
        status: 'awaiting_manual_paste',
        failureReason: reason,
        notesPresent,
      });

      console.error('[crystallize] extraction failed:', error);

      await insertAssistantMessage(supabase, {
        conversationId,
        content: createFallbackMessage({
          sourceTitle: queueItem.title,
          sourceDomain: queueItem.source_domain,
          sourceUrl: queueItem.url,
          reason,
        }),
        metadata,
      });

      return NextResponse.json({
        conversationId,
        queueItemId: queueItem.id,
        mode: 'awaiting_manual_paste',
        reason,
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[crystallize] start failed:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
