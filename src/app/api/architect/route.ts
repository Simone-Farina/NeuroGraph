import { generateObject, NoObjectGeneratedError, APICallError } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  architectResponseSchema,
  buildArchitectPrompt,
} from '@/lib/ai/architect';
import { getModelForRole } from '@/lib/ai/providers';
import { ARCHITECT_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { getAuthenticatedUser } from '@/lib/auth/server';
import { buildTelemetry } from '@/lib/ai/tracing';

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

    const model = getModelForRole('inquisitor');
    const target = parsed.data.target;

    const { object } = await generateObject({
      model,
      schema: architectResponseSchema,
      system: ARCHITECT_SYSTEM_PROMPT,
      prompt: buildArchitectPrompt(target),
      experimental_telemetry: buildTelemetry('architect', {
        userId: auth.user.id,
        extra: { target },
      }),
      maxRetries: 2,
      abortSignal: AbortSignal.timeout(25_000),
    });

    return NextResponse.json({
      target,
      draft: object,
    });
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      console.error('[architect] NoObjectGeneratedError:', error);
      return NextResponse.json(
        { error: 'AI failed to produce a valid knowledge structure. Please rephrase your target.' },
        { status: 422 }
      );
    }
    if (APICallError.isInstance(error)) {
      console.error('[architect] APICallError:', error.statusCode, error.message);
      return NextResponse.json({ error: 'AI provider error' }, { status: 502 });
    }
    const message = error instanceof Error ? error.message : 'Architect request failed';
    console.error('[architect] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
