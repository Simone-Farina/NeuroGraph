import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/auth/supabase';
import { getModelForRole } from '@/lib/ai/providers';

const actionRequestSchema = z.object({
  type: z.enum(['summarize', 'expand', 'rewrite', 'challenge', 'connect', 'inline-chat']),
  content: z.string().min(1).max(10000),
  selection: z.string().optional(), // For bubble menu / inline chat
  neuronTitle: z.string().optional(),
});

const SYSTEM_PROMPTS: Record<string, string> = {
  summarize: `You are a knowledge distillation engine. Condense the provided content into the 3-5 most essential bullet points. Be terse and precise. Use plain markdown list format. Do not repeat the title.`,

  expand: `You are a depth-enrichment engine. Elaborate on the provided concept with concrete examples, analogies, or real-world applications. Add genuine intellectual value — do not pad. Use clear paragraphs.`,

  rewrite: `You are a precision editor. Rewrite the provided text for maximum clarity and signal density. Remove fluff. Preserve all key ideas. Favor short, declarative sentences.`,

  challenge: `You are a Socratic adversary. Find the weakest assumptions, potential counterexamples, or logical gaps in the provided content. Present 2-3 sharp challenges as a numbered list.`,

  connect: `You are a cross-domain synthesist. Identify what disciplines, concepts, or theories this idea connects to outside the obvious domain. Suggest 2-3 non-obvious intellectual bridges.`,

  'inline-chat': `You are a focused writing assistant. The user has selected a specific passage and wants help with it. Respond directly and concisely to their request about that passage.`,
};

/**
 * POST /api/neurons/ai-action
 *
 * Streaming AI text generation for slash commands and bubble menu actions.
 * Returns a streamed text response compatible with the Vercel AI SDK.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const parsed = actionRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid payload', issues: parsed.error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { type, content, selection, neuronTitle } = parsed.data;
    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS['inline-chat'];

    let prompt: string;

    if (type === 'inline-chat' && selection) {
      prompt = `Selected passage:
"${selection}"

Full document context:
${content}

User request: Help me improve or understand this selected passage.`;
    } else {
      prompt = neuronTitle
        ? `Neuron: "${neuronTitle}"\n\n${content}`
        : content;
    }

    const model = getModelForRole('synthesis_fast');

    const result = streamText({
      model,
      system: systemPrompt,
      prompt,
      maxOutputTokens: 600,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI action failed';
    console.error('[ai-action] Error:', error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
