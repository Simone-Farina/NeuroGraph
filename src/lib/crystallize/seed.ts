import { generateText } from 'ai';
import { z } from 'zod';

import { getModelForRole } from '@/lib/ai/providers';
import { buildTelemetry } from '@/lib/ai/tracing';

const seedSchema = z.object({
  briefing: z.string().min(1),
  openingQuestion: z.string().min(1),
});

const SYSTEM_PROMPT = `You are preparing the opening move of a crystallization chat.
Return strict JSON with exactly these keys:
- briefing: a concise 3-5 sentence editorial briefing
- openingQuestion: one Socratic question that invites active reasoning

Rules:
- Do not dump raw source text.
- Keep the briefing compact and specific.
- Make the question concrete and reflective, not generic.
- Return JSON only.`;

type GenerateCrystallizeSeedInput = {
  sourceTitle: string;
  sourceUrl: string | null;
  sourceDomain: string | null;
  sourceText: string;
  notes: string | null;
  userId?: string; // for telemetry
};

type RenderCrystallizeAssistantMessageInput = {
  sourceTitle: string;
  sourceDomainOrUrl: string;
  briefing: string;
  openingQuestion: string;
  notes: string | null;
};

function stripCodeFences(text: string) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

function parseSeedResponse(text: string) {
  const parsed = seedSchema.safeParse(JSON.parse(stripCodeFences(text)));

  if (!parsed.success) {
    throw new Error('Invalid crystallize seed response');
  }

  return {
    briefing: parsed.data.briefing.trim(),
    openingQuestion: parsed.data.openingQuestion.trim(),
  };
}

export async function generateCrystallizeSeed(input: GenerateCrystallizeSeedInput) {
  const sourceDescriptor = input.sourceDomain ?? input.sourceUrl ?? 'manual source';
  const notesBlock = input.notes?.trim() ? `Queue notes:\n${input.notes.trim()}\n\n` : '';

  const { text } = await generateText({
    model: getModelForRole('synthesizer'),
    system: SYSTEM_PROMPT,
    prompt: `Source title: ${input.sourceTitle}
Source: ${sourceDescriptor}

${notesBlock}Source text:
${input.sourceText}`,
    experimental_telemetry: buildTelemetry('crystallize-seed', {
      ...(input.userId ? { userId: input.userId } : {}),
    }),
  });

  const seed = parseSeedResponse(text);

  return {
    ...seed,
    assistantMessage: renderCrystallizeAssistantMessage({
      sourceTitle: input.sourceTitle,
      sourceDomainOrUrl: sourceDescriptor,
      briefing: seed.briefing,
      openingQuestion: seed.openingQuestion,
      notes: input.notes,
    }),
  };
}

export function renderCrystallizeAssistantMessage(
  input: RenderCrystallizeAssistantMessageInput
) {
  const sections = [
    input.sourceTitle.trim(),
    input.sourceDomainOrUrl.trim(),
    '',
    input.briefing.trim(),
  ];

  if (input.notes?.trim()) {
    sections.push('', `Queue note: ${input.notes.trim()}`);
  }

  sections.push('', `Question: ${input.openingQuestion.trim()}`);

  return sections.join('\n');
}
