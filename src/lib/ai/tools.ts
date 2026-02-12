import { tool } from 'ai';
import { z } from 'zod';

const parameters = z.object({
  title: z
    .string()
    .min(3)
    .max(120)
    .describe('Concise title for the crystal (3-120 chars)'),
  definition: z
    .string()
    .min(10)
    .max(280)
    .describe('Brief, self-contained definition or summary (10-280 chars)'),
  core_insight: z
    .string()
    .min(10)
    .max(500)
    .describe('The key takeaway or "aha" moment from the conversation (10-500 chars)'),
  bloom_level: z
    .enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'])
    .describe("Bloom's taxonomy level that best describes the depth of understanding"),
});

/**
 * Tool the AI calls when it identifies a durable insight worth crystallizing.
 *
 * Defined **without** an `execute` function so the invocation is forwarded
 * to the client as a `tool-invocation` message part.  The user sees a
 * "Potential Crystal" card and can confirm or dismiss it.
 */
export const suggestCrystallizationTool = tool({
  description:
    'Suggest crystallizing a durable insight from the conversation into a knowledge node. ' +
    'Call this when the user demonstrates genuine analytical depth — not for surface-level facts.',
  inputSchema: parameters as any,
});
