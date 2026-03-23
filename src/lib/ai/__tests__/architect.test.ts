import { describe, expect, it } from 'vitest';

import { architectResponseSchema } from '../architect';

describe('architectResponseSchema', () => {
  it('accepts a valid acyclic architect graph', () => {
    const result = architectResponseSchema.safeParse({
      isValid: true,
      nodes: [
        {
          title: 'Linear Algebra',
          definition: 'Linear algebra studies vectors, matrices, and linear transformations.',
          bloom_level: 'Understand',
        },
        {
          title: 'Machine Learning',
          definition: 'Machine learning builds predictive models from data.',
          bloom_level: 'Apply',
        },
      ],
      synapses: [
        {
          sourceTitle: 'Linear Algebra',
          targetTitle: 'Machine Learning',
          type: 'PREREQUISITE',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects cycles in pedagogical edges', () => {
    const result = architectResponseSchema.safeParse({
      isValid: true,
      nodes: [
        {
          title: 'Theory A',
          definition: 'Theory A is the first half of a contradictory pair.',
          bloom_level: 'Understand',
        },
        {
          title: 'Theory B',
          definition: 'Theory B is the second half of a contradictory pair.',
          bloom_level: 'Understand',
        },
      ],
      synapses: [
        {
          sourceTitle: 'Theory A',
          targetTitle: 'Theory B',
          type: 'PREREQUISITE',
        },
        {
          sourceTitle: 'Theory B',
          targetTitle: 'Theory A',
          type: 'PREREQUISITE',
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('requires refusalReason and empty arrays for invalid responses', () => {
    const missingReason = architectResponseSchema.safeParse({
      isValid: false,
      nodes: [],
      synapses: [],
    });

    expect(missingReason.success).toBe(false);

    const nonEmptyInvalid = architectResponseSchema.safeParse({
      isValid: false,
      refusalReason: 'Cycle detected between A and B.',
      nodes: [
        {
          title: 'Theory A',
          definition: 'Theory A is contradictory in this request.',
          bloom_level: 'Understand',
        },
      ],
      synapses: [],
    });

    expect(nonEmptyInvalid.success).toBe(false);
  });
});
