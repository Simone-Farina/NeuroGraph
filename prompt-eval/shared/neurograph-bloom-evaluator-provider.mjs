import fs from 'node:fs';
import path from 'node:path';

import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const [, , prompt = '', optionsJson = '{}', contextJson = '{}'] = process.argv;

// Keyword signals indicating Analyze/Evaluate/Create level cognitive depth.
// Per CONTEXT.md: keyword-based heuristic for offline CI fallback.
const ANALYZE_SIGNALS = [
  'compare',
  'tradeoff',
  'trade-off',
  'mechanism',
  'why does',
  'what if',
  'evaluate',
  'design',
  'create',
  'propose',
  'because',
  'therefore',
  'however',
  'dissect',
  'argument',
  'critique',
  'contrast',
  'distinguish',
];

function parseJson(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
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

/**
 * Resolves the model to use for Bloom evaluator.
 * Checks PROMPTFOO_BLOOM_EVALUATOR_MODEL env var first, then AI_MODEL_EVALUATOR,
 * then falls back to google:gemini-2.5-flash (per CONTEXT.md: best cost/speed ratio).
 * Returns null if AI_PROVIDER=mock or no API key is available (triggers heuristic mode).
 */
function resolveModel() {
  const raw =
    process.env.PROMPTFOO_BLOOM_EVALUATOR_MODEL ||
    process.env.AI_MODEL_EVALUATOR ||
    'google:gemini-2.5-flash';

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
    default:
      return null;
  }
}

/**
 * Reads the Bloom evaluator system prompt from prompt.txt.
 * Path is resolved relative to the bloom-evaluator directory.
 */
function extractBloomPrompt() {
  const promptPath = path.resolve(process.cwd(), 'prompt-eval/bloom-evaluator/prompt.txt');
  return fs.readFileSync(promptPath, 'utf8');
}

/**
 * Builds evaluator input messages from vars.messages.
 * Extracts the last 3 user messages for Bloom classification.
 * Returns a formatted string describing the messages to evaluate.
 */
function buildMessages(vars) {
  const allMessages = Array.isArray(vars.messages) ? vars.messages : [];
  const userMessages = allMessages.filter((m) => m.role === 'user');
  const last3 = userMessages.slice(-3);

  if (last3.length === 0) {
    return 'No user messages to evaluate.';
  }

  const formatted = last3
    .map((m, i) => `User message ${i + 1}: "${String(m.content)}"`)
    .join('\n');

  return `Evaluate the cognitive depth of these user messages:\n\n${formatted}`;
}

/**
 * Heuristic offline fallback for Bloom evaluation.
 * Uses keyword-based signals to classify without calling a real model.
 * Per plan spec: 2+ Analyze signals → Analyze (0.80), otherwise Understand (0.85).
 */
function heuristicBloomEvaluator(vars) {
  const allMessages = Array.isArray(vars.messages) ? vars.messages : [];
  const userMessages = allMessages.filter((m) => m.role === 'user');
  const last3 = userMessages.slice(-3);
  const combinedText = last3
    .map((m) => String(m.content).toLowerCase())
    .join(' ');

  const signalCount = ANALYZE_SIGNALS.filter((signal) =>
    combinedText.includes(signal)
  ).length;

  if (signalCount >= 2) {
    return {
      reasoning:
        'Heuristic: multiple analytical signals detected (' +
        signalCount +
        ' keyword matches: ' +
        ANALYZE_SIGNALS.filter((s) => combinedText.includes(s)).join(', ') +
        ')',
      bloom_level: 'Analyze',
      confidence: 0.8,
    };
  }

  return {
    reasoning:
      'Heuristic: surface-level discourse — fewer than 2 analytical signals detected (' +
      signalCount +
      ' found)',
    bloom_level: 'Understand',
    confidence: 0.85,
  };
}

async function main() {
  const options = parseJson(optionsJson, {});
  const context = parseJson(contextJson, {});
  const vars = context?.vars ?? {};
  const model = resolveModel();

  // Heuristic mode: no model available (offline CI, mock provider, or no API key)
  if (!model) {
    process.stdout.write(JSON.stringify(heuristicBloomEvaluator(vars)));
    return;
  }

  const systemPrompt = extractBloomPrompt();
  const userContent = buildMessages(vars);

  try {
    const { text } = await generateText({
      model,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
      temperature: 0,
      maxOutputTokens: 400,
    });

    // Parse JSON from response — model instructed to return only JSON
    const trimmed = text.trim();
    // Strip markdown code fences if model wraps the JSON
    const jsonText = trimmed
      .replace(/^```(?:json)?\n?/, '')
      .replace(/\n?```$/, '')
      .trim();

    const parsed = parseJson(jsonText, null);

    if (
      parsed &&
      typeof parsed.reasoning === 'string' &&
      typeof parsed.bloom_level === 'string' &&
      typeof parsed.confidence === 'number'
    ) {
      process.stdout.write(JSON.stringify(parsed));
    } else {
      // Malformed response — fall back to heuristic
      process.stdout.write(JSON.stringify(heuristicBloomEvaluator(vars)));
    }
  } catch {
    // On any live-mode error, fall back to heuristic
    process.stdout.write(JSON.stringify(heuristicBloomEvaluator(vars)));
  }
}

await main();
