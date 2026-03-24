import { describe, expect, it } from 'vitest';
import { zodSchema } from 'ai';

import { prerequisiteInferenceSchema } from '../inferPrerequisites';

describe('prerequisiteInferenceSchema', () => {
  it('accepts empty prerequisites with null suggested_next', () => {
    const result = prerequisiteInferenceSchema.safeParse({
      prerequisites: [],
      suggested_next: null,
    });

    expect(result.success).toBe(true);
  });

  it('accepts prerequisites with a valid suggested_next array', () => {
    const result = prerequisiteInferenceSchema.safeParse({
      prerequisites: [
        {
          neuron_id: '550e8400-e29b-41d4-a716-446655440000',
          confidence: 0.9,
          reasoning: 'Linear algebra is foundational for machine learning.',
        },
      ],
      suggested_next: [
        {
          title: 'Deep Learning',
          reasoning: 'Natural progression after mastering ML fundamentals.',
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it('rejects when suggested_next is entirely absent (field is required, not optional)', () => {
    const result = prerequisiteInferenceSchema.safeParse({
      prerequisites: [],
      // suggested_next is intentionally omitted
    });

    expect(result.success).toBe(false);
  });

  it('includes suggested_next in JSON Schema required array', () => {
    const jsonSchema = zodSchema(prerequisiteInferenceSchema).jsonSchema;
    expect(jsonSchema.required).toContain('suggested_next');
  });
});
