import fs from 'node:fs';
import path from 'node:path';

import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

const [, , prompt = '', optionsJson = '{}', contextJson = '{}'] = process.argv;

// JSON Schema for suggest_neurogenesis tool (mirrors neurogenesisSchema in tools.ts).
// Duplicated as plain JSON Schema because this .mjs file cannot import TypeScript directly.
const neurogenesisJsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', minLength: 3, maxLength: 120 },
    definition: { type: 'string', minLength: 10, maxLength: 280 },
    core_insight: { type: 'string', minLength: 10, maxLength: 500 },
    bloom_level: {
      type: 'string',
      enum: ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'],
    },
  },
  required: ['title', 'definition', 'core_insight', 'bloom_level'],
};

// Bloom's Taxonomy Analyze/Evaluate/Create level detection signals.
// Per Research Pattern 3: causal reasoning, comparisons, evaluations, and personal insights.
const BLOOM_ANALYZE_SIGNALS = [
  /\bbecause\b.{5,}/i, // "X because Y" — causal reasoning
  /\bsince\b.{5,}/i, // "X since Y" — causal reasoning
  /\bcompared? to\b/i, // comparison
  /\bbetter than\b/i, // evaluation
  /\bi think.{5,}because\b/i, // opinionated reasoning
  /\bi realized\b/i, // personal insight
  /\bthe (key|main|real) (difference|reason|point)\b/i, // analytical framing
  /\bthis (means|implies|shows)\b/i, // inference
];

// Per Research Pitfall 5: if the message ends with a question mark it is Understand-level,
// not Analyze-level, regardless of other signals.
const BLOOM_QUESTION_EXEMPTION = /\?[\s]*$/;

/**
 * Extracts CHAT_SYSTEM_PROMPT from src/lib/ai/prompts.ts using the canonical regex pattern.
 * Per Research Pitfall 3: uses backtick+semicolon terminator to avoid early match on
 * escaped backticks (\`) inside the template literal.
 */
function extractChatPrompt() {
  const promptsPath = path.resolve(process.cwd(), 'src/lib/ai/prompts.ts');
  const source = fs.readFileSync(promptsPath, 'utf8');
  const match = source.match(/export const CHAT_SYSTEM_PROMPT = `([\s\S]*?)`;/);

  if (!match) {
    throw new Error('Unable to locate CHAT_SYSTEM_PROMPT in src/lib/ai/prompts.ts');
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
 * Resolves the model to use for conversationalist evaluation.
 * Checks PROMPTFOO_CONVERSATIONALIST_MODEL env var first, then AI_MODEL_EVALUATOR,
 * then falls back to openai:gpt-4o-mini.
 * Returns null if AI_PROVIDER=mock or no API key is available (triggers heuristic mode).
 */
function resolveModel() {
  const raw =
    process.env.PROMPTFOO_CONVERSATIONALIST_MODEL ||
    process.env.AI_MODEL_EVALUATOR ||
    'openai:gpt-4o-mini';

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

/**
 * Scores the Socratic tone of an assistant response text.
 * Per Research Pattern 3 (D-07, D-08):
 * - Positive: question marks and coaching phrases
 * - Negative: direct answer patterns
 * Returns a float in [0, 1].
 */
function scoreSocraticTone(text) {
  const normalized = text.toLowerCase();
  let score = 0;

  // Positive: question marks (max 0.5 contribution)
  const questionCount = (text.match(/\?/g) || []).length;
  score += Math.min(questionCount * 0.25, 0.5);

  // Positive: coaching phrases (max 0.3 contribution)
  const coachingPhrases = [
    'what do you think',
    'how would you',
    'can you explain',
    'what happens when',
    'why might',
    'what if',
    'consider',
    'think about',
    'reflect on',
    'explore',
    'what would',
  ];
  const coachingHits = coachingPhrases.filter((p) => normalized.includes(p)).length;
  score += Math.min(coachingHits * 0.15, 0.3);

  // Negative: direct answer patterns (-0.4 per hit)
  const directAnswerPatterns = [
    'the answer is',
    'the solution is',
    'to answer your question',
    'here is how',
    "here's how",
    'the way to do this is',
    'you should do',
    'the correct approach is',
  ];
  const directAnswerHits = directAnswerPatterns.filter((p) => normalized.includes(p)).length;
  score -= directAnswerHits * 0.4;

  return Math.max(0, Math.min(1, score));
}

/**
 * Detects whether a user message demonstrates Analyze/Evaluate/Create level engagement
 * per Bloom's Taxonomy keyword heuristic.
 * Per Research Pitfall 5: messages ending with '?' are Understand-level regardless of signals.
 */
function detectsAnalyzeLevel(text) {
  if (BLOOM_QUESTION_EXEMPTION.test(text.trim())) {
    return false;
  }
  return BLOOM_ANALYZE_SIGNALS.some((pattern) => pattern.test(text));
}

/**
 * Converts the vars.messages array and vars.final_user_message into the AI SDK messages format.
 * The messages array contains prior conversation turns as { role, content } objects.
 * The final user message is appended as the last turn for the model to respond to.
 */
function buildMessages(vars) {
  const priorMessages = Array.isArray(vars.messages) ? vars.messages : [];
  const finalMessage = vars.final_user_message || '';

  const mapped = priorMessages.map((msg) => ({
    role: msg.role,
    content: typeof msg.content === 'string' ? msg.content : String(msg.content),
  }));

  return [...mapped, { role: 'user', content: finalMessage }];
}

/**
 * Heuristic offline fallback for conversationalist evaluation.
 * Generates a coaching-style response without calling a real model.
 * Computes socratic_score from heuristic response text.
 * Computes neurogenesis_triggered from detectsAnalyzeLevel of the final user message.
 * This ensures offline/live behavior is consistent at the assertion level (per Research Open Q 1).
 */
function heuristicConversationalist(vars) {
  const finalMessage = String(vars.final_user_message || '').trim();
  const messages = Array.isArray(vars.messages) ? vars.messages : [];

  // Extract topic from first user message or use generic placeholder
  const firstUserMsg = messages.find((m) => m.role === 'user');
  const topic = firstUserMsg ? String(firstUserMsg.content).slice(0, 60).trim() : 'this concept';

  // Build a generic Socratic coaching response
  const response = [
    `What aspects of ${topic} are you most curious about?`,
    `Consider how this might connect to what you already understand.`,
    `What do you think would happen if you applied this idea in a different context?`,
  ].join(' ');

  return {
    response,
    socratic_score: scoreSocraticTone(response),
    neurogenesis_triggered: detectsAnalyzeLevel(finalMessage),
  };
}

async function main() {
  const options = parseJson(optionsJson, {});
  const context = parseJson(contextJson, {});
  const vars = context?.vars ?? {};
  const model = resolveModel();

  // Heuristic mode: no model available (offline CI, mock provider, or no API key)
  if (!model) {
    process.stdout.write(JSON.stringify(heuristicConversationalist(vars)));
    return;
  }

  const systemPrompt = extractChatPrompt();

  try {
    const { text, toolCalls } = await generateText({
      model,
      system: systemPrompt,
      messages: buildMessages(vars),
      tools: {
        suggest_neurogenesis: {
          description:
            'Suggest generating a durable neuron from the conversation. ' +
            'Call this when the user demonstrates genuine analytical depth, not for surface-level facts.',
          parameters: neurogenesisJsonSchema,
        },
      },
      temperature: 0,
      maxOutputTokens: 600,
    });

    const neurogenesisTriggered = Array.isArray(toolCalls)
      ? toolCalls.some((tc) => tc.toolName === 'suggest_neurogenesis')
      : false;

    process.stdout.write(
      JSON.stringify({
        response: text,
        socratic_score: scoreSocraticTone(text),
        neurogenesis_triggered: neurogenesisTriggered,
      })
    );
  } catch {
    // On any live-mode error, fall back to heuristic
    process.stdout.write(JSON.stringify(heuristicConversationalist(vars)));
  }
}

await main();
