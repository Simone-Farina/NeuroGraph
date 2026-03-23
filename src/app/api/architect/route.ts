import { generateObject } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  architectResponseSchema,
  buildArchitectPrompt,
} from '@/lib/ai/architect';
import { getModelForRole } from '@/lib/ai/providers';
import { ARCHITECT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { getAuthenticatedUser } from '@/lib/auth/server';

const architectRequestSchema = z.object({
  target: z.string().trim().min(3).max(120),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser();
    if (auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await request.json();
    const parsed = architectRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const model = getModelForRole('neurogenesis_heavy');
    const target = parsed.data.target;

    const { object } = await generateObject({
      model,
      schema: architectResponseSchema,
      system: ARCHITECT_SYSTEM_PROMPT,
      prompt: buildArchitectPrompt(target),
    });

    return NextResponse.json({
      target,
      draft: object,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Architect request failed';
    console.error('[architect] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
