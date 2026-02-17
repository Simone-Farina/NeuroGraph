import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { crystalQueries } from '@/lib/db/queries';
import { generateEmbedding } from '@/lib/ai/embeddings';

const updateCrystalSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  definition: z.string().min(10).max(280).optional(),
  core_insight: z.string().min(10).max(500).optional(),
  content: z.string().optional(),
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

    const parsed = updateCrystalSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const updates = parsed.data;
    
    const existingCrystal = await crystalQueries.getById(supabase, id);
    if (!existingCrystal) {
      return NextResponse.json({ error: 'Crystal not found' }, { status: 404 });
    }

    if (existingCrystal.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const needsEmbeddingUpdate =
      (updates.title && updates.title !== existingCrystal.title) ||
      (updates.definition && updates.definition !== existingCrystal.definition) ||
      (updates.core_insight && updates.core_insight !== existingCrystal.core_insight);

    let embedding = existingCrystal.embedding;
    if (needsEmbeddingUpdate) {
      const title = updates.title ?? existingCrystal.title;
      const definition = updates.definition ?? existingCrystal.definition;
      const coreInsight = updates.core_insight ?? existingCrystal.core_insight;
      
      const embeddingInput = `${title} ${definition} ${coreInsight}`;
      embedding = await generateEmbedding(embeddingInput);
    }

    const updatedCrystal = await crystalQueries.update(supabase, id, {
      ...updates,
      embedding: needsEmbeddingUpdate ? embedding : undefined,
      user_modified: true,
      modified_at: new Date().toISOString(),
    });

    return NextResponse.json({ crystal: updatedCrystal });
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

    const crystal = await crystalQueries.getById(supabase, id);
    if (!crystal) {
      return NextResponse.json({ error: 'Crystal not found' }, { status: 404 });
    }

    if (crystal.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await crystalQueries.delete(supabase, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
