import { describe, it, expect } from 'vitest';
import { crystallizationSchema } from './tools';

describe('Crystallization Tool Schema', () => {
  it('should validate a correct full input', () => {
    const validInput = {
      title: 'Valid Title',
      definition: 'This is a valid definition for the concept.',
      core_insight: 'The core insight is that testing is important.',
      bloom_level: 'Apply',
      related_crystals: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Related Concept',
          relationship_type: 'RELATED',
        },
      ],
    };
    const result = crystallizationSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate a correct minimal input', () => {
    const validMinimalInput = {
      title: 'Valid Title',
      definition: 'This is a valid definition for the concept.',
      core_insight: 'The core insight is that testing is important.',
      bloom_level: 'Remember',
    };
    const result = crystallizationSchema.safeParse(validMinimalInput);
    expect(result.success).toBe(true);
  });

  it('should fail when required fields are missing', () => {
    const invalidInput = {
      title: 'Valid Title',
      // Missing definition
      core_insight: 'The core insight is that testing is important.',
      bloom_level: 'Remember',
    };
    const result = crystallizationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.definition).toBeDefined();
    }
  });

  it('should fail when fields have invalid types', () => {
    const invalidInput = {
      title: 123, // Should be string
      definition: 'This is a valid definition for the concept.',
      core_insight: 'The core insight is that testing is important.',
      bloom_level: 'Remember',
    };
    const result = crystallizationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
     if (!result.success) {
      expect(result.error.flatten().fieldErrors.title).toBeDefined();
    }
  });

  it('should enforce string length constraints', () => {
    const invalidInput = {
      title: 'A', // Too short (min 3)
      definition: 'Short', // Too short (min 10)
      core_insight: 'Short', // Too short (min 10)
      bloom_level: 'Remember',
    };
    const result = crystallizationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.title).toBeDefined();
        expect(errors.definition).toBeDefined();
        expect(errors.core_insight).toBeDefined();
    }
  });

  it('should enforce enum values for bloom_level', () => {
    const invalidInput = {
      title: 'Valid Title',
      definition: 'This is a valid definition for the concept.',
      core_insight: 'The core insight is that testing is important.',
      bloom_level: 'InvalidLevel',
    };
    const result = crystallizationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
     if (!result.success) {
      expect(result.error.flatten().fieldErrors.bloom_level).toBeDefined();
    }
  });

  it('should enforce uuid format for related crystal id', () => {
      const invalidInput = {
      title: 'Valid Title',
      definition: 'This is a valid definition for the concept.',
      core_insight: 'The core insight is that testing is important.',
      bloom_level: 'Apply',
      related_crystals: [
        {
          id: 'not-a-uuid',
          title: 'Related Concept',
          relationship_type: 'RELATED',
        },
      ],
    };
    const result = crystallizationSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
  });
});
