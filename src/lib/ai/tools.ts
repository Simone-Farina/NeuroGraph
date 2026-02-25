import { tool } from 'ai';
import { z } from 'zod';

const relationshipTypeSchema = z.enum(['PREREQUISITE', 'RELATED', 'BUILDS_ON']);

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
    .enum(['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'])
    .describe("Bloom's taxonomy level that best describes the depth of understanding"),
  related_neurons: z
    .array(
      z.object({
        id: z.string().uuid().describe('Existing neuron id to potentially connect to'),
        title: z.string().min(1).max(120).describe('Existing neuron title').optional(),
        relationship_type: relationshipTypeSchema.describe(
          'Relationship from the new neuron to this existing neuron'
        ),
      })
    )
    .max(5)
    .optional()
    .describe('Optional graph connection suggestions using existing neuron ids'),
});

export const neurogenesisSchema = parameters;

export const suggestNeurogenesisTool = tool({
  description:
    'Suggest generating a durable neuron from the conversation. ' +
    'Call this when the user demonstrates genuine analytical depth, not for surface-level facts.',
  inputSchema: parameters,
});
