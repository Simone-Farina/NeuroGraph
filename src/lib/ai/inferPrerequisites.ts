import { z } from 'zod';
import { generateObject } from 'ai';
import { getModelForRole } from '@/lib/ai/providers';
import { createServerSupabaseClient } from '@/lib/auth/supabase';

/**
 * Zod schema for the AI prerequisite inference output.
 * The AI identifies which existing neurons are true prerequisites for the new concept,
 * and optionally suggests 1-2 ghost nodes as logical next learning steps.
 */
export const prerequisiteInferenceSchema = z.object({
  prerequisites: z.array(z.object({
    neuron_id: z.string().uuid().describe('The UUID of an existing neuron that is a true prerequisite'),
    confidence: z.number().min(0).max(1).describe('How confident the AI is that this is a real prerequisite (0-1)'),
    reasoning: z.string().max(200).describe('Brief explanation of why this is a prerequisite'),
  })).describe('Existing neurons that must be understood BEFORE the new concept'),
  suggested_next: z.array(z.object({
    title: z.string().max(120).describe('Title of a logical next concept to learn'),
    reasoning: z.string().max(200).describe('Why this is a natural next step'),
  })).max(2).nullable().describe('1-2 organic ghost node suggestions as next learning steps, or null if none'),
});

export type PrerequisiteInferenceResult = z.infer<typeof prerequisiteInferenceSchema>;

/**
 * Uses the heavy neurogenesis AI model to analyze a new neuron against existing ones
 * and determine which are true prerequisites (not just semantically related).
 *
 * Also optionally suggests 1-2 ghost nodes as "organic compass" next steps.
 */
export async function inferPrerequisites(
  newNeuron: { title: string; definition: string; core_insight: string },
  candidateNeurons: { id: string; title: string; definition: string }[],
): Promise<PrerequisiteInferenceResult> {
  if (candidateNeurons.length === 0) {
    return { prerequisites: [], suggested_next: null };
  }

  const model = getModelForRole('neurogenesis_heavy');

  const candidateList = candidateNeurons
    .map((n, i) => `${i + 1}. [${n.id}] "${n.title}" — ${n.definition}`)
    .join('\n');

  const { object } = await generateObject({
    model,
    schema: prerequisiteInferenceSchema,
    system: `You are a pedagogical graph engine for NeuroGraph.
Your task is to determine which existing concepts are TRUE PREREQUISITES for a newly learned concept.

A prerequisite means: "You MUST understand concept A before you can properly understand concept B."
- "Linear Algebra" is a prerequisite for "Neural Networks"
- "Neural Networks" is NOT a prerequisite for "Linear Algebra" (it's the reverse)
- "Python" is NOT a prerequisite for "JavaScript" (they are related, not dependent)

Rules:
- Only mark concepts that have a strict pedagogical dependency
- Do NOT mark merely related or tangentially connected concepts
- Confidence should reflect how certain you are (0.9+ for obvious dependencies like math→physics)
- For suggested_next: propose 1-2 concepts that would naturally follow from mastering the new concept
- suggested_next titles should be specific and learnable (not vague categories)`,
    prompt: `New Neuron:
Title: "${newNeuron.title}"
Definition: ${newNeuron.definition}
Core Insight: ${newNeuron.core_insight}

Existing Neurons (candidates for prerequisites):
${candidateList}

Which of these existing neurons are true prerequisites for "${newNeuron.title}"?
Also suggest 1-2 natural next learning steps after mastering this concept.`,
  });

  return object;
}

/**
 * After inferring prerequisites, create PREREQUISITE synapses in the database.
 * Returns the list of linked neuron titles for the UI toast.
 */
export async function createPrerequisiteSynapses(
  userId: string,
  newNeuronId: string,
  prerequisites: PrerequisiteInferenceResult['prerequisites'],
): Promise<string[]> {
  if (prerequisites.length === 0) return [];

  const supabase = await createServerSupabaseClient();

  // Filter to high-confidence prerequisites only (>= 0.6)
  const highConfidence = prerequisites.filter(p => p.confidence >= 0.6);
  if (highConfidence.length === 0) return [];

  const inserts = highConfidence.map(p => ({
    user_id: userId,
    source_neuron_id: p.neuron_id, // prerequisite points TO the new neuron
    target_neuron_id: newNeuronId,
    type: 'PREREQUISITE' as const,
    weight: p.confidence,
    ai_suggested: true,
  }));

  const { error } = await supabase
    .from('synapses')
    .upsert(inserts, {
      onConflict: 'source_neuron_id,target_neuron_id,type',
      ignoreDuplicates: true,
    });

  if (error) {
    console.error('[inferPrerequisites] Failed to create synapses:', error);
    return [];
  }

  // Return the titles of linked neurons for the toast
  const { data: linkedNeurons } = await supabase
    .from('neurons')
    .select('title')
    .in('id', highConfidence.map(p => p.neuron_id));

  return (linkedNeurons ?? []).map(n => n.title);
}
