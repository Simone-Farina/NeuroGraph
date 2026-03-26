import { z } from 'zod';
import { generateObject } from 'ai';
// Errors propagate to the caller (neurogenesis/route.ts) — no catch here
import { getModelForRole } from '@/lib/ai/providers';
import { buildTelemetry } from '@/lib/ai/tracing';

/**
 * Zod schema for the Synthesizer output.
 * Captures the canonical knowledge unit distilled from a conversation.
 */
export const synthesizerOutputSchema = z.object({
  title: z.string().min(3).max(120).describe('Canonical concept name — specific, not a sentence'),
  definition: z
    .string()
    .min(10)
    .max(280)
    .describe('Textbook-quality concise definition (1-2 sentences)'),
  core_insight: z
    .string()
    .min(10)
    .max(500)
    .describe("The 'aha moment' — the deepest insight the learner reached in the conversation"),
});

export type SynthesizerOutput = z.infer<typeof synthesizerOutputSchema>;

/**
 * Distills a conversation into a canonical neuron using the evaluator model (cheap/fast).
 *
 * Passes the last 20 messages to the model and extracts the single deepest insight
 * as a structured title/definition/core_insight triple.
 *
 * @param messages - Full conversation messages with role and content
 * @param userId   - Optional user ID for Langfuse span correlation
 * @returns Structured SynthesizerOutput (throws on AI or validation failure)
 */
export async function synthesize(
  messages: { role: string; content: string }[],
  userId?: string,
): Promise<SynthesizerOutput> {
  const model = getModelForRole('bloomEvaluator');

  // Take only the last 20 messages to keep prompt size bounded
  const recentMessages = messages.slice(-20);

  const formattedMessages = recentMessages
    .map((m) => `${m.role.charAt(0).toUpperCase() + m.role.slice(1)}: ${m.content}`)
    .join('\n\n');

  const { object } = await generateObject({
    model,
    schema: synthesizerOutputSchema,
    maxRetries: 2,
    abortSignal: AbortSignal.timeout(25_000),
    experimental_telemetry: buildTelemetry('neurogenesis-synthesizer', {
      ...(userId ? { userId } : {}),
    }),
    system: `You are a knowledge distillation engine. Analyze the conversation below and extract the single deepest insight the learner has reached. Synthesize it into a canonical knowledge unit with a precise title, a concise definition (1-2 sentences), and the core insight that makes this concept click. The title should be a specific concept name (not a sentence). The definition should be textbook-quality. The core insight should capture the 'aha moment' from the conversation.`,
    prompt: formattedMessages,
  });

  return object;
}
