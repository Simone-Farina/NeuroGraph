import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { scheduleReview, Rating } from '@/lib/ai/fsrs';
import { Neuron } from '@/types/database';

const reviewParamsSchema = z.object({
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { rating } = reviewParamsSchema.parse(body);

    // 1. Fetch the target neuron
    const { data: neuron, error: fetchError } = await supabase
      .from('neurons')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !neuron) {
      return NextResponse.json({ error: 'Neuron not found.' }, { status: 404 });
    }

    // 2. Schedule regular FSRS review
    const now = new Date();
    const newFsrsState = scheduleReview(neuron as Neuron, rating, now);

    // Update target neuron
    const { data: updatedNeuron, error: updateError } = await supabase
      .from('neurons')
      .update(newFsrsState)
      .eq('id', neuron.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 3. Upward FIRe Healing Logic (Fractional Implicit Repetition)
    let healedNodeIds: string[] = [];

    if (rating === Rating.Good || rating === Rating.Easy) {
      // Find all upstream prerequisite ancestors
      const { data: ancestors, error: rpcError } = await supabase
        .rpc('get_prerequisite_ancestors', { match_neuron_id: neuron.id });
      
      if (!rpcError && ancestors && ancestors.length > 0) {
        const ancestorIds = ancestors.map(a => a.neuron_id);
        
        // Fetch rows to calculate shadow updates
        const { data: ancestorNeurons } = await supabase
          .from('neurons')
          .select('*')
          .in('id', ancestorIds);

        if (ancestorNeurons && ancestorNeurons.length > 0) {
          // Calculate shadow reviews (synthetic "Good" rating)
          const shadowUpdates = ancestorNeurons.map(anc => {
            const shadowState = scheduleReview(anc as Neuron, Rating.Good, now);
            return {
              id: anc.id,
              ...shadowState
            };
          });

          // Perform batch updates via promise.all 
          // (Supabase JS doesn't have a single bulk update endpoint for arbitrary fields easily without upsert collisions, so we'll map updates)
          const updatePromises = shadowUpdates.map(updateData => 
             supabase.from('neurons').update(updateData).eq('id', updateData.id)
          );

          await Promise.allSettled(updatePromises);
          healedNodeIds = ancestorIds;
        }
      }
    }

    return NextResponse.json({ 
      neuron: updatedNeuron,
      healed_node_ids: healedNodeIds 
    }, { status: 200 });

  } catch (error) {
    console.error('[API] Error in /neurons/[id]/review:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid rating parameter.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
