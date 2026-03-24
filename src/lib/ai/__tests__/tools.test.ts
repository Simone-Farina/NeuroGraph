import { describe, it, expect } from 'vitest';
import { neurogenesisSchema } from '../tools';

describe('Neurogenesis Tool Schema', () => {
  it('should validate a complete valid input', () => {
    const validInput = {
      title: 'Valid Title',
      definition: 'This is a valid definition for the neuron.',
      core_insight: 'This is a core insight that explains the concept.',
      bloom_level: 'Analyze',
    };
    const result = neurogenesisSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('should validate minimal valid input', () => {
    const minimalInput = {
      title: 'Valid Title',
      definition: 'This is a valid definition for the neuron.',
      core_insight: 'This is a core insight that explains the concept.',
      bloom_level: 'Analyze',
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
          bloom_level: 'Analyze',
        }).success
      ).toBe(false);

      // Too long
      expect(
        neurogenesisSchema.safeParse({
          title: 'a'.repeat(121),
          definition: 'Valid definition text here.',
          core_insight: 'Valid core insight text here.',
          bloom_level: 'Analyze',
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
          bloom_level: 'Analyze',
        }).success
      ).toBe(false);

      // Too long
      expect(
        neurogenesisSchema.safeParse({
          title: 'Valid Title',
          definition: 'a'.repeat(281),
          core_insight: 'Valid core insight text here.',
          bloom_level: 'Analyze',
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
          bloom_level: 'Analyze',
        }).success
      ).toBe(false);

      // Too long
      expect(
        neurogenesisSchema.safeParse({
          title: 'Valid Title',
          definition: 'Valid definition text here.',
          core_insight: 'a'.repeat(501),
          bloom_level: 'Analyze',
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

    it('rejects bloom_level values below Analyze threshold', () => {
      expect(
        neurogenesisSchema.safeParse({
          title: 'Valid Title',
          definition: 'Valid definition text here.',
          core_insight: 'Valid core insight text here.',
          bloom_level: 'Remember',
        }).success
      ).toBe(false);

      expect(
        neurogenesisSchema.safeParse({
          title: 'Valid Title',
          definition: 'Valid definition text here.',
          core_insight: 'Valid core insight text here.',
          bloom_level: 'Understand',
        }).success
      ).toBe(false);

      expect(
        neurogenesisSchema.safeParse({
          title: 'Valid Title',
          definition: 'Valid definition text here.',
          core_insight: 'Valid core insight text here.',
          bloom_level: 'Apply',
        }).success
      ).toBe(false);
    });

    it('accepts valid Bloom levels: Evaluate and Create', () => {
      expect(
        neurogenesisSchema.safeParse({
          title: 'Valid Title',
          definition: 'Valid definition text here.',
          core_insight: 'Valid core insight text here.',
          bloom_level: 'Evaluate',
        }).success
      ).toBe(true);

      expect(
        neurogenesisSchema.safeParse({
          title: 'Valid Title',
          definition: 'Valid definition text here.',
          core_insight: 'Valid core insight text here.',
          bloom_level: 'Create',
        }).success
      ).toBe(true);
    });
  });
});
