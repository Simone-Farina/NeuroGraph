import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { getModelForRole } from '@/lib/ai/providers';
import { buildTelemetry, langfuseProcessor } from '@/lib/ai/tracing';

// Bloom evaluator system prompt — kept inline for evaluator self-containment.
// Source: prompt-eval/bloom-evaluator/prompt.txt
const BLOOM_EVALUATOR_PROMPT = `You are the Bloom Evaluator — a cognitive depth classifier for the NeuroGraph learning platform.

Your task is to analyze the LAST 3 user messages from the conversation provided and determine their collective Bloom's Taxonomy level.

## Bloom's Taxonomy Levels

**Remember** — Recalling facts, definitions, or sequences from memory.
Examples: "What is X?", "X is defined as Y", "The steps are A, B, C."

**Understand** — Paraphrasing, summarizing, or explaining in one's own words. No novel inference yet.
Examples: "So X means Y in other words", "TCP uses a three-way handshake to establish a connection", "Photosynthesis converts sunlight into chemical energy."

**Apply** — Using a known procedure or concept to solve a new but familiar problem.
Examples: "To find the area, I multiply length by width", "I used recursion to solve the tree traversal."

**Analyze** — Breaking down a concept into parts, examining relationships, identifying cause-and-effect, comparing tradeoffs.
Examples: "The tradeoff between SQL and NoSQL shifts when read-heavy workloads dominate because joins become the bottleneck", "Generational garbage collection reduces full-GC frequency by isolating short-lived objects."

**Evaluate** — Making judgments, critiquing, arguing a position with supporting evidence.
Examples: "I'd argue microservices are strictly worse for solo developers because coordination costs exceed deployment flexibility benefits", "ACID guarantees are worth the scalability penalty when consistency is non-negotiable."

**Create** — Synthesizing ideas into a novel proposal, design, or framework not seen in the source material.
Examples: "What if we combined spaced repetition with knowledge graphs, weighting edges by retention decay?", "I designed a two-tier caching approach where hot data uses in-memory LRU and warm data uses Redis."

## Critical Boundary: Understand vs Analyze

This is the most important distinction. A message is Understand-level when it:
- Restates or paraphrases what was already said or is widely known
- Explains a mechanism without questioning or critiquing it
- Summarizes textbook content accurately

A message is Analyze-level (or higher) when it:
- Compares two things and explains WHY one is better/worse in specific conditions
- Identifies a causal mechanism ("X happens BECAUSE Y")
- Dissects tradeoffs explicitly ("the benefit of X is offset by the cost of Y when Z")
- Proposes a hypothesis or "what if" that extends beyond what was stated

## Question Exemption

If the user's most recent message ends with a question mark, the level is capped at Understand regardless of other signals — asking a question demonstrates engagement but not yet deep analysis.

## Output Format

You MUST reason step-by-step before classifying. Think through:
1. What is the cognitive operation each message performs?
2. Is the user recalling, paraphrasing, applying, comparing tradeoffs, judging, or creating?
3. What is the highest level reached across the last 3 messages?
4. How confident are you? Consider: clear signals → high confidence (0.85+); ambiguous messages → lower confidence (0.6-0.75).

Return a JSON object with exactly these fields:
{
  "reasoning": "<your step-by-step chain of thought>",
  "bloom_level": "<one of: Remember, Understand, Apply, Analyze, Evaluate, Create>",
  "confidence": <float between 0.0 and 1.0>
}

Do not include any text outside the JSON object.`;

const bloomEvalSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      })
    )
    .min(1),
  conversationId: z.string().uuid().optional(),
});

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
    const parsed = bloomEvalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { bloom_level: null, confidence: 0, reasoning: 'Invalid request payload' },
        { status: 200 }
      );
    }

    const { messages, conversationId } = parsed.data;

    // Extract the last 3 user messages for Bloom classification
    const userMessages = messages.filter((m) => m.role === 'user');
    const last3 = userMessages.slice(-3);

    const formattedPrompt =
      last3.length === 0
        ? 'No user messages to evaluate.'
        : `Evaluate the cognitive depth of these user messages:\n\n${last3.map((m, i) => `User message ${i + 1}: "${m.content}"`).join('\n')}`;

    const model = getModelForRole('evaluator');

    const { text } = await generateText({
      model,
      system: BLOOM_EVALUATOR_PROMPT,
      prompt: formattedPrompt,
      experimental_telemetry: buildTelemetry('bloom-evaluator', {
        userId: user.id,
        conversationId,
      }),
      maxRetries: 1,
      abortSignal: AbortSignal.timeout(10_000),
    });

    // Parse JSON from response — model is instructed to return only JSON
    const trimmed = text.trim();
    // Strip markdown code fences if model wraps the JSON
    const jsonText = trimmed
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    let bloom_level: string | null = null;
    let confidence = 0;
    let reasoning = 'Evaluation failed';

    try {
      const result = JSON.parse(jsonText) as unknown;
      if (
        result &&
        typeof result === 'object' &&
        'bloom_level' in result &&
        'confidence' in result &&
        'reasoning' in result &&
        typeof (result as { bloom_level: unknown }).bloom_level === 'string' &&
        typeof (result as { confidence: unknown }).confidence === 'number' &&
        typeof (result as { reasoning: unknown }).reasoning === 'string'
      ) {
        bloom_level = (result as { bloom_level: string }).bloom_level;
        confidence = (result as { confidence: number }).confidence;
        reasoning = (result as { reasoning: string }).reasoning;
      }
    } catch {
      // JSON parse failed — fall through to graceful degradation response
    }

    return NextResponse.json({ bloom_level, confidence, reasoning });
  } catch {
    // Per CONTEXT.md anti-pattern: "better false positive than blocked user"
    // NEVER return 500 — failures degrade gracefully with bloom_level: null
    return NextResponse.json(
      { bloom_level: null, confidence: 0, reasoning: 'Evaluation failed' },
      { status: 200 }
    );
  } finally {
    // Flush Langfuse telemetry before function exits
    try {
      await langfuseProcessor.forceFlush();
    } catch {
      // Flush failure is non-fatal — continue
    }
  }
}
