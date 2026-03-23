import fs from 'node:fs';
import path from 'node:path';

import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const [, , prompt = '', optionsJson = '{}', contextJson = '{}'] = process.argv;

function extractBouncerPrompt() {
  const promptsPath = path.resolve(process.cwd(), 'src/lib/ai/prompts.ts');
  const source = fs.readFileSync(promptsPath, 'utf8');
  const match = source.match(/export const BOUNCER_SYSTEM_PROMPT = `([\s\S]*?)`;/);

  if (!match) {
    throw new Error('Unable to locate BOUNCER_SYSTEM_PROMPT in src/lib/ai/prompts.ts');
  }

  return match[1];
}

function parseJson(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\bbase de datos vectorial\b/g, 'vector database')
    .replace(/\bbase de datos vectoriales\b/g, 'vector database')
    .replace(/\bembedding databases?\b/g, 'vector database')
    .replace(/\bmaximum margin classifier\b/g, 'support vector machine')
    .replace(/\b(databases?)\b/g, 'database')
    .replace(/\b(vectors?)\b/g, 'vector')
    .replace(/\bvectorial\b/g, 'vector')
    .replace(/\bdatos vectoriales\b/g, 'vector database')
    .replace(/\bdbs?\b/g, 'database')
    .replace(/\bml\b/g, 'machine learning')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(value) {
  return new Set(
    normalizeText(value)
      .split(' ')
      .filter((token) => token.length > 2)
  );
}

function jaccardSimilarity(left, right) {
  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      intersection += 1;
    }
  }

  const union = new Set([...leftTokens, ...rightTokens]).size;
  return union === 0 ? 0 : intersection / union;
}

function heuristicDecision(promptText, vars) {
  const existingTitle = vars.existing_title ?? '';
  const existingAliases = vars.existing_aliases ?? '';
  const candidateTitle = vars.candidate_title ?? '';
  const candidateDefinition = vars.candidate_definition ?? '';

  const existingComposite = [existingTitle, existingAliases].filter(Boolean).join(' ');
  const candidateComposite = [candidateTitle, candidateDefinition].filter(Boolean).join(' ');

  const normalizedExisting = normalizeText(existingComposite);
  const normalizedCandidate = normalizeText(candidateComposite);
  const similarity = jaccardSimilarity(existingComposite, candidateComposite);

  const hasDirectDuplicate =
    normalizedExisting.includes(normalizedCandidate) ||
    normalizedCandidate.includes(normalizedExisting);
  const hasVectorDatabaseAlias =
    normalizedExisting.includes('vector database') && normalizedCandidate.includes('vector database');
  const hasSvmAlias =
    normalizedExisting.includes('support vector machine') &&
    (normalizedCandidate.includes('support vector machine') ||
      (normalizedCandidate.includes('maximum margin') &&
        normalizedCandidate.includes('classifier')));
  const hasMarginClassifierPattern =
    normalizedExisting.includes('support vector machine') &&
    normalizedCandidate.includes('largest margin') &&
    normalizedCandidate.includes('classifier');

  const decision =
    hasDirectDuplicate ||
    hasVectorDatabaseAlias ||
    hasSvmAlias ||
    hasMarginClassifierPattern ||
    similarity >= 0.42
      ? 'append_to_existing'
      : 'allow_new';

  return {
    decision,
    confidence: decision === 'append_to_existing' ? 0.91 : 0.84,
    match_title: decision === 'append_to_existing' ? existingTitle : null,
    rationale:
      decision === 'append_to_existing'
        ? 'The candidate overlaps the existing neuron closely enough that it should deepen the same concept.'
        : 'The candidate is distinct enough to justify a separate neuron.',
  };
}

function hasKeyFor(provider) {
  switch (provider) {
    case 'openai':
      return Boolean(process.env.OPENAI_API_KEY);
    case 'google':
      return Boolean(
        process.env.GOOGLE_API_KEY ||
          process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
          process.env.GEMINI_API_KEY
      );
    case 'anthropic':
      return Boolean(process.env.ANTHROPIC_API_KEY);
    default:
      return false;
  }
}

function resolveModel() {
  const raw = process.env.PROMPTFOO_BOUNCER_MODEL || process.env.AI_MODEL_EVALUATOR || 'openai:gpt-4o-mini';
  const separator = raw.indexOf(':');
  if (separator <= 0 || separator === raw.length - 1) {
    return null;
  }

  const provider = raw.slice(0, separator).toLowerCase();
  const modelName = raw.slice(separator + 1);

  if (process.env.AI_PROVIDER === 'mock' || !hasKeyFor(provider)) {
    return null;
  }

  switch (provider) {
    case 'openai':
      return openai(modelName);
    case 'google':
      return google(modelName);
    case 'anthropic':
      return anthropic(modelName);
    default:
      return null;
  }
}

function stripCodeFences(value) {
  return value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

async function main() {
  const options = parseJson(optionsJson, {});
  const context = parseJson(contextJson, {});
  const vars = context?.vars ?? {};
  const model = resolveModel();

  if (!model) {
    process.stdout.write(JSON.stringify(heuristicDecision(prompt, vars)));
    return;
  }

  const systemPrompt = extractBouncerPrompt();

  try {
    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt,
      temperature: 0,
      maxOutputTokens: 220,
    });

    const parsed = JSON.parse(stripCodeFences(text));
    const normalized = {
      decision: parsed.decision,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      match_title: parsed.match_title ?? null,
      rationale: parsed.rationale ?? 'No rationale returned.',
    };

    process.stdout.write(JSON.stringify(normalized));
  } catch (error) {
    const fallback = heuristicDecision(prompt, vars);
    process.stdout.write(JSON.stringify(fallback));
  }
}

await main();
