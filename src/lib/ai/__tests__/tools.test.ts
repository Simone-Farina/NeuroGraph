import { describe, it, expect } from 'vitest';
import { neurogenesisSchema } from '../tools';

describe('Neurogenesis Tool Schema', () => {
  it('should validate a complete valid input', () => {
    const validInput = {
      title: 'Valid Title',
      definition: 'This is a valid definition for the neuron.',
      core_insight: 'This is a core insight that explains the concept.',
      bloom_level: 'Understand',
      related_neurons: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Related Neuron',
          relationship_type: 'RELATED',
        },
      ],
    };
    const result = neurogenesisSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate minimal valid input', () => {
    const minimalInput = {
      title: 'Valid Title',
      definition: 'This is a valid definition for the neuron.',
      core_insight: 'This is a core insight that explains the concept.',
      bloom_level: 'Apply',
    };
    const result = neurogenesisSchema.safeParse(minimalInput);
    expect(result.success).toBe(true);
  });

  it('should fail when required fields are missing', () => {
    const invalidInput = {
      title: 'Valid Title',
    };
    const result = neurogenesisSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.definition).toBeDefined();
      expect(errors.core_insight).toBeDefined();
      expect(errors.bloom_level).toBeDefined();
    }
  });

  describe('Field Validation', () => {
    it('should validate title length', () => {
      // Too short
      expect(
        neurogenesisSchema.safeParse({
          title: 'No',
          definition: 'Valid definition text here.',
          core_insight: 'Valid core insight text here.',
          bloom_level: 'Remember',
        }).success
      ).toBe(false);

      // Too long
      expect(
        neurogenesisSchema.safeParse({
          title: 'a'.repeat(121),
          definition: 'Valid definition text here.',
          core_insight: 'Valid core insight text here.',
          bloom_level: 'Remember',
        }).success
      ).toBe(false);
    });

    it('should validate definition length', () => {
       // Too short
       expect(
        neurogenesisSchema.safeParse({
          title: 'Valid Title',
          definition: 'Short',
          core_insight: 'Valid core insight text here.',
          bloom_level: 'Remember',
        }).success
      ).toBe(false);

      // Too long
      expect(
        neurogenesisSchema.safeParse({
          title: 'Valid Title',
          definition: 'a'.repeat(281),
          core_insight: 'Valid core insight text here.',
          bloom_level: 'Remember',
        }).success
      ).toBe(false);
    });

    it('should validate core_insight length', () => {
       // Too short
       expect(
        neurogenesisSchema.safeParse({
          title: 'Valid Title',
          definition: 'Valid definition text here.',
          core_insight: 'Short',
          bloom_level: 'Remember',
        }).success
      ).toBe(false);

      // Too long
      expect(
        neurogenesisSchema.safeParse({
          title: 'Valid Title',
          definition: 'Valid definition text here.',
          core_insight: 'a'.repeat(501),
          bloom_level: 'Remember',
        }).success
      ).toBe(false);
    });

    it('should validate bloom_level enum', () => {
      expect(
        neurogenesisSchema.safeParse({
          title: 'Valid Title',
          definition: 'Valid definition text here.',
          core_insight: 'Valid core insight text here.',
          bloom_level: 'InvalidLevel',
        }).success
      ).toBe(false);
    });
  });

  describe('Related Neurons Validation', () => {
    it('should validate related_neurons array length', () => {
      const validInput = {
        title: 'Valid Title',
        definition: 'Valid definition text here.',
        core_insight: 'Valid core insight text here.',
        bloom_level: 'Remember',
        related_neurons: Array(6).fill({
          id: '123e4567-e89b-12d3-a456-426614174000',
          relationship_type: 'RELATED',
        }),
      };
      const result = neurogenesisSchema.safeParse(validInput);
      expect(result.success).toBe(false);
    });

    it('should validate related neuron id is uuid', () => {
      const invalidIdInput = {
        title: 'Valid Title',
        definition: 'Valid definition text here.',
        core_insight: 'Valid core insight text here.',
        bloom_level: 'Remember',
        related_neurons: [
            {
                id: 'not-a-uuid',
                relationship_type: 'RELATED',
            }
        ],
      };
      const result = neurogenesisSchema.safeParse(invalidIdInput);
      expect(result.success).toBe(false);
    });

     it('should validate relationship_type enum', () => {
      const invalidTypeInput = {
        title: 'Valid Title',
        definition: 'Valid definition text here.',
        core_insight: 'Valid core insight text here.',
        bloom_level: 'Remember',
        related_neurons: [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                relationship_type: 'INVALID_TYPE',
            }
        ],
      };
      const result = neurogenesisSchema.safeParse(invalidTypeInput);
      expect(result.success).toBe(false);
    });
  });
});
