import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { neuronQueries } from '@/lib/db/queries';
import { generateEmbedding } from '@/lib/ai/embeddings';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const neuron = await neuronQueries.getById(supabase, id);
    if (!neuron) {
      return NextResponse.json({ error: 'Neuron not found' }, { status: 404 });
    }

    if (neuron.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const backlinks = await neuronQueries.getBacklinksByTitle(supabase, user.id, neuron.title);

    return NextResponse.json({ neuron, backlinks });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

const updateNeuronSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  definition: z.string().min(10).max(280).optional(),
  core_insight: z.string().min(10).max(500).optional(),
  content: z.string().optional(),
  append_content: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = updateNeuronSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { append_content, ...updates } = parsed.data;

    const existingNeuron = await neuronQueries.getById(supabase, id);
    if (!existingNeuron) {
      return NextResponse.json({ error: 'Neuron not found' }, { status: 404 });
    }

    if (existingNeuron.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Handle append_content: append as blockquote to existing content
    if (append_content) {
      const currentContent = existingNeuron.content || '';
      updates.content = currentContent + '\n\n> ' + append_content.replace(/\n/g, '\n> ');
    }

    const needsEmbeddingUpdate =
      (updates.title && updates.title !== existingNeuron.title) ||
      (updates.definition && updates.definition !== existingNeuron.definition) ||
      (updates.core_insight && updates.core_insight !== existingNeuron.core_insight);

    let embedding = existingNeuron.embedding;
    if (needsEmbeddingUpdate) {
      const title = updates.title ?? existingNeuron.title;
      const definition = updates.definition ?? existingNeuron.definition;
      const coreInsight = updates.core_insight ?? existingNeuron.core_insight;

      const embeddingInput = `${title} ${definition} ${coreInsight}`;
      embedding = await generateEmbedding(embeddingInput);
    }

    let updatedNeuron;
    try {
      updatedNeuron = await neuronQueries.update(supabase, id, {
        ...updates,
        embedding: needsEmbeddingUpdate ? embedding : undefined,
        user_modified: true,
        modified_at: new Date().toISOString(),
      });
    } catch (updateError: unknown) {
      if (
        updateError &&
        typeof updateError === 'object' &&
        'code' in updateError &&
        updateError.code === '23505'
      ) {
        return NextResponse.json(
          { error: 'A neuron with this title already exists' },
          { status: 409 }
        );
      }
      throw updateError;
    }

    return NextResponse.json({ neuron: updatedNeuron });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const neuron = await neuronQueries.getById(supabase, id);
    if (!neuron) {
      return NextResponse.json({ error: 'Neuron not found' }, { status: 404 });
    }

    if (neuron.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await neuronQueries.delete(supabase, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
