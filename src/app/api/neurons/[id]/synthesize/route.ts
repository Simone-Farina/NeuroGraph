import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { generateText } from 'ai';

import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { neuronQueries } from '@/lib/db/queries';
import { getSynthesisModel } from '@/lib/ai/providers';

const synthesizeSchema = z.object({
  newText: z.string().min(1).max(5000),
});

const SYSTEM_PROMPT = `Sei un editor tecnico. Hai il seguente documento Markdown.
Integra organicamente la "Nuova Informazione" fornita dall'utente all'interno del documento.
Non cancellare i concetti esistenti, riformula solo dove necessario per creare un testo coerente.
Restituisci SOLO il Markdown finale, senza preamboli.`;

export async function POST(
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

    const parsed = synthesizeSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const neuron = await neuronQueries.getById(supabase, id);
    if (!neuron) {
      return NextResponse.json({ error: 'Neuron not found' }, { status: 404 });
    }

    if (neuron.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const currentContent = neuron.content || '';
    const { newText } = parsed.data;

    const userPrompt = `## Documento attuale\n\n${currentContent || '*(vuoto)*'}\n\n## Nuova Informazione\n\n${newText}`;

    const { text } = await generateText({
      model: getSynthesisModel(),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    const updatedNeuron = await neuronQueries.update(supabase, id, {
      content: text,
      user_modified: true,
      modified_at: new Date().toISOString(),
    });

    return NextResponse.json({ neuron: updatedNeuron });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
