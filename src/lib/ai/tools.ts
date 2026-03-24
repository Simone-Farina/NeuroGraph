import { tool } from 'ai';
import { z } from 'zod';

const parameters = z.object({
  title: z
    .string()
    .min(3)
    .max(120)
    .describe('Concise title for the neuron (3-120 chars)'),
  definition: z
    .string()
    .min(10)
    .max(280)
    .describe('Brief, self-contained definition or summary (10-280 chars)'),
  core_insight: z
    .string()
    .min(10)
    .max(500)
    .describe('The key takeaway or aha moment from the conversation (10-500 chars)'),
  bloom_level: z
    .enum(['Analyze', 'Evaluate', 'Create'])
    .describe("Bloom's taxonomy level — only Analyze, Evaluate, or Create level insights qualify for neurogenesis"),
});

export const neurogenesisSchema = parameters;

export const suggestNeurogenesisTool = tool({
  description:
    'Suggest generating a durable neuron from the conversation. ' +
    'Call this when the user demonstrates genuine analytical depth, not for surface-level facts. ' +
    'Graph topology (prerequisites) is handled automatically by the Epistemological Inquisitor.',
  inputSchema: parameters,
});
