import { z } from 'zod';

export const architectRelationshipTypeSchema = z.enum(['PREREQUISITE', 'RELATED', 'BUILDS_ON']);

export const architectBloomLevelSchema = z.enum([
  'Remember',
  'Understand',
  'Apply',
  'Analyze',
  'Evaluate',
  'Create',
]);

export const architectNodeSchema = z
  .object({
    title: z.string().min(1).max(120),
    definition: z.string().min(10).max(280),
    bloom_level: architectBloomLevelSchema,
  })
  .strict();

export const architectSynapseSchema = z
  .object({
    sourceTitle: z.string().min(1).max(120),
    targetTitle: z.string().min(1).max(120),
    type: architectRelationshipTypeSchema,
  })
  .strict();

function findPedagogicalCycle(
  synapses: Array<z.infer<typeof architectSynapseSchema>>
): string[] | null {
  const adjacency = new Map<string, string[]>();

  for (const synapse of synapses) {
    if (synapse.type === 'RELATED') {
      continue;
    }

    const existing = adjacency.get(synapse.sourceTitle) ?? [];
    existing.push(synapse.targetTitle);
    adjacency.set(synapse.sourceTitle, existing);
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): string[] | null {
    visiting.add(node);
    path.push(node);

    for (const next of adjacency.get(node) ?? []) {
      if (visiting.has(next)) {
        const cycleStart = path.indexOf(next);
        return [...path.slice(cycleStart), next];
      }

      if (!visited.has(next)) {
        const cycle = dfs(next);
        if (cycle) {
          return cycle;
        }
      }
    }

    path.pop();
    visiting.delete(node);
    visited.add(node);
    return null;
  }

  for (const node of Array.from(adjacency.keys())) {
    if (!visited.has(node)) {
      const cycle = dfs(node);
      if (cycle) {
        return cycle;
      }
    }
  }

  return null;
}

export const architectResponseSchema = z
  .object({
    isValid: z.boolean(),
    refusalReason: z.string().min(1).nullable(),
    nodes: z.array(architectNodeSchema),
    synapses: z.array(architectSynapseSchema),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.isValid) {
      if (!value.refusalReason) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['refusalReason'],
          message: 'refusalReason is required when isValid is false.',
        });
      }

      if (value.nodes.length > 0 || value.synapses.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nodes'],
          message: 'Invalid graphs must return empty nodes and synapses arrays.',
        });
      }

      return;
    }

    if (value.refusalReason !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['refusalReason'],
        message: 'refusalReason must be null when isValid is true.',
      });
    }

    if (value.nodes.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nodes'],
        message: 'Valid graphs must include at least one node.',
      });
    }

    const seenTitles = new Set<string>();
    for (let index = 0; index < value.nodes.length; index += 1) {
      const node = value.nodes[index];
      if (seenTitles.has(node.title)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['nodes', index, 'title'],
          message: `Duplicate node title "${node.title}" is not allowed.`,
        });
      }

      seenTitles.add(node.title);
    }

    const seenSynapses = new Set<string>();
    for (let index = 0; index < value.synapses.length; index += 1) {
      const synapse = value.synapses[index];
      if (!seenTitles.has(synapse.sourceTitle)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['synapses', index, 'sourceTitle'],
          message: `Synapse source "${synapse.sourceTitle}" does not match any node title.`,
        });
      }

      if (!seenTitles.has(synapse.targetTitle)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['synapses', index, 'targetTitle'],
          message: `Synapse target "${synapse.targetTitle}" does not match any node title.`,
        });
      }

      if (synapse.sourceTitle === synapse.targetTitle) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['synapses', index],
          message: 'Self-referential synapses are not allowed.',
        });
      }

      const key = `${synapse.sourceTitle}::${synapse.targetTitle}::${synapse.type}`;
      if (seenSynapses.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['synapses', index],
          message: 'Duplicate synapses are not allowed.',
        });
      }

      seenSynapses.add(key);
    }

    const cycle = findPedagogicalCycle(value.synapses);
    if (cycle) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['synapses'],
        message: `Pedagogical cycle detected: ${cycle.join(' -> ')}`,
      });
    }
  });

export function buildArchitectPrompt(target: string) {
  return `Target topic: ${target}

Design a concise learning blueprint for this target.

Instructions:
- Create between 4 and 8 nodes total.
- Include the target topic itself as one of the nodes.
- Prefer prerequisite structure over flat brainstorming.
- Use RELATED only for true lateral bridges.
- Keep definitions concise, concrete, and high-signal.
- If the request cannot be represented without a pedagogical paradox or cycle, refuse explicitly.

Return JSON only.`;
}

export function createGhostNodeId(title: string) {
  return `ghost:${encodeURIComponent(title)}`;
}

export type ArchitectNode = z.infer<typeof architectNodeSchema>;
export type ArchitectSynapse = z.infer<typeof architectSynapseSchema>;
export type ArchitectResponse = z.infer<typeof architectResponseSchema>;
