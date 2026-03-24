import { describe, expect, it } from 'vitest';
import { zodSchema } from 'ai';

import { architectResponseSchema } from '../architect';

describe('architectResponseSchema', () => {
  it('accepts a valid acyclic architect graph', () => {
    const result = architectResponseSchema.safeParse({
      isValid: true,
      refusalReason: null,
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

  it('accepts valid graph with explicit refusalReason: null', () => {
    const result = architectResponseSchema.safeParse({
      isValid: true,
      refusalReason: null,
      nodes: [
        {
          title: 'Calculus',
          definition: 'Calculus is the mathematical study of continuous change.',
          bloom_level: 'Understand',
        },
      ],
      synapses: [],
    });

    expect(result.success).toBe(true);
  });

  it('rejects valid graph (isValid: true) with non-null refusalReason', () => {
    const result = architectResponseSchema.safeParse({
      isValid: true,
      refusalReason: 'some reason',
      nodes: [
        {
          title: 'Calculus',
          definition: 'Calculus is the mathematical study of continuous change.',
          bloom_level: 'Understand',
        },
      ],
      synapses: [],
    });

    expect(result.success).toBe(false);
  });

  it('accepts invalid response (isValid: false) with a refusalReason string', () => {
    const result = architectResponseSchema.safeParse({
      isValid: false,
      refusalReason: 'Cycle detected',
      nodes: [],
      synapses: [],
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid response (isValid: false) with refusalReason: null', () => {
    const result = architectResponseSchema.safeParse({
      isValid: false,
      refusalReason: null,
      nodes: [],
      synapses: [],
    });

    expect(result.success).toBe(false);
  });

  it('rejects cycles in pedagogical edges', () => {
    const result = architectResponseSchema.safeParse({
      isValid: true,
      refusalReason: null,
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
      refusalReason: null,
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

  it('includes refusalReason in JSON Schema required array', () => {
    const jsonSchema = zodSchema(architectResponseSchema).jsonSchema;
    expect(jsonSchema.required).toContain('refusalReason');
  });
});
