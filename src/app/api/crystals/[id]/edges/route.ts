import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { createServerSupabaseClient } from '@/lib/auth/supabase';

const routeParamsSchema = z.object({
  id: z.uuid(),
});

const createEdgeSchema = z.object({
  target_id: z.uuid(),
  type: z.enum(['PREREQUISITE', 'RELATED', 'BUILDS_ON']),
  weight: z.number().min(0).max(1),
  ai_suggested: z.boolean().optional().default(false),
});

const deleteEdgeSchema = z.object({
  edge_id: z.uuid(),
});

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const params = routeParamsSchema.safeParse(context.params);
    if (!params.success) {
      return NextResponse.json(
        { error: 'Invalid crystal id', issues: params.error.issues },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('crystal_edges')
      .select('*')
      .eq('user_id', user.id)
      .or(`source_crystal_id.eq.${params.data.id},target_crystal_id.eq.${params.data.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ edges: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    const params = routeParamsSchema.safeParse(context.params);
    if (!params.success) {
      return NextResponse.json(
        { error: 'Invalid crystal id', issues: params.error.issues },
        { status: 400 }
      );
    }

    const parsed = createEdgeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    if (parsed.data.target_id === params.data.id) {
      return NextResponse.json({ error: 'A crystal cannot connect to itself' }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [{ data: sourceCrystal, error: sourceError }, { data: targetCrystal, error: targetError }] =
      await Promise.all([
        supabase
          .from('crystals')
          .select('id')
          .eq('id', params.data.id)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('crystals')
          .select('id')
          .eq('id', parsed.data.target_id)
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);

    if (sourceError || targetError) {
      return NextResponse.json(
        { error: sourceError?.message ?? targetError?.message ?? 'Failed to validate crystals' },
        { status: 500 }
      );
    }

    if (!sourceCrystal || !targetCrystal) {
      return NextResponse.json({ error: 'Crystal not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('crystal_edges')
      .insert({
        user_id: user.id,
        source_crystal_id: params.data.id,
        target_crystal_id: parsed.data.target_id,
        type: parsed.data.type,
        weight: parsed.data.weight,
        ai_suggested: parsed.data.ai_suggested,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        const { data: existingEdge, error: existingEdgeError } = await supabase
          .from('crystal_edges')
          .select('*')
          .eq('user_id', user.id)
          .eq('source_crystal_id', params.data.id)
          .eq('target_crystal_id', parsed.data.target_id)
          .eq('type', parsed.data.type)
          .single();

        if (existingEdgeError) {
          return NextResponse.json({ error: existingEdgeError.message }, { status: 500 });
        }

        return NextResponse.json({ edge: existingEdge }, { status: 200 });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ edge: data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    const params = routeParamsSchema.safeParse(context.params);
    if (!params.success) {
      return NextResponse.json(
        { error: 'Invalid crystal id', issues: params.error.issues },
        { status: 400 }
      );
    }

    const parsed = deleteEdgeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('crystal_edges')
      .delete()
      .eq('id', parsed.data.edge_id)
      .eq('user_id', user.id)
      .or(`source_crystal_id.eq.${params.data.id},target_crystal_id.eq.${params.data.id}`)
      .select('id')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Edge not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
