import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateObject, NoObjectGeneratedError, APICallError } from 'ai';
import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { getModelForRole } from '@/lib/ai/providers';
import { buildTelemetry } from '@/lib/ai/tracing';

const extractionRequestSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(20).max(10000),
});

const extractionResultSchema = z.object({
  definition: z.string().describe('A concise, self-contained definition of the concept (max 280 chars)'),
  core_insight: z.string().describe('The key takeaway or deepest insight from the writing (max 500 chars)'),
  bloom_level: z.enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'])
    .describe('The Bloom taxonomy level demonstrated by the content'),
  suggested_synapses: z.array(z.string()).describe('A list of other neuron titles that are conceptually prerequisites or related to this content'),
});

/**
 * POST /api/neurons/extract
 *
 * Background AI extraction endpoint. Given a neuron title and free-form content,
 * infers the definition, core_insight, and bloom_level using the fast synthesis model.
 * Called by the editor as the user writes.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = extractionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { title, content } = parsed.data;

    const model = getModelForRole('synthesis_fast');

    const { object } = await generateObject({
      model,
      schema: extractionResultSchema,
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(25_000),
      experimental_telemetry: buildTelemetry('bouncer-extract', { userId: user.id }),
      system: `You are a knowledge graph extraction engine for NeuroGraph.
Your task is to analyze a free-form note and extract structured metadata.

Rules:
- definition: A clear, self-contained definition of the concept, written as if for a dictionary or textbook. Max 280 characters.
- core_insight: The deepest, most non-obvious takeaway the author has internalized. Should be a genuine insight, not a summary. Max 500 characters.
- bloom_level: Assess the cognitive depth demonstrated:
  - Remember: Recalls facts
  - Understand: Explains concepts
  - Apply: Uses concepts in examples
  - Analyze: Breaks down and compares
  - Evaluate: Judges and critiques
  - Create: Synthesizes something new
- suggested_synapses: Identify other concepts the user might have in their brain that this note relies on or connects to. Return only titles.

Be precise. Prefer specific, high-signal language over vague paraphrasing.`,
      prompt: `Title: ${title}

Content:
${content}

Extract the definition, core_insight, and bloom_level for this neuron.`,
    });

    return NextResponse.json(object);
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error('[extract] NoObjectGeneratedError:', error);
      return NextResponse.json(
        { error: 'Could not extract metadata from this content. Try adding more detail.' },
        { status: 422 }
      );
    }
    if (APICallError.isInstance(error)) {
      console.error('[extract] APICallError:', error.statusCode, error.message);
      return NextResponse.json({ error: 'AI provider error' }, { status: 502 });
    }
    const message = error instanceof Error ? error.message : 'Extraction failed';
    console.error('[extract] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
