import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { mockModel, mockEmbeddingModel } from '@/lib/ai/mock-provider';

// ─── OpenRouter (OpenAI-compatible) ──────────────────────────────────────────

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
  compatibility: 'compatible', // Use /chat/completions, not /responses (OpenRouter doesn't support the Responses API)
});

// ─── Role registry ────────────────────────────────────────────────────────────

export type ModelRole = 'chat' | 'synthesis_fast' | 'neurogenesis_heavy' | 'evaluator';

/** Human-readable labels for error messages. */
const ROLE_LABEL: Record<ModelRole, string> = {
  chat:               'Chat (Conversationalist)',
  synthesis_fast:     'Synthesizer',
  neurogenesis_heavy: 'Inquisitor / Architect',
  evaluator:          'Bloom Evaluator',
};

/**
 * Environment variable names per role (checked in order, first found wins).
 * Canonical name first, legacy alias second.
 */
const ROLE_ENV: Record<ModelRole, string[]> = {
  chat:               ['AI_MODEL_CHAT'],
  synthesis_fast:     ['AI_MODEL_SYNTHESIZER', 'AI_MODEL_SYNTHESIS_FAST'],
  neurogenesis_heavy: ['AI_MODEL_INQUISITOR', 'AI_MODEL_NEUROGENESIS_HEAVY'],
  evaluator:          ['AI_MODEL_EVALUATOR'],
};

// ─── Core resolver ────────────────────────────────────────────────────────────

const SUPPORTED_PROVIDERS = ['openai', 'anthropic', 'google', 'openrouter'] as const;

function resolveFromString(raw: string, role: ModelRole) {
  const sep = raw.indexOf(':');

  if (sep <= 0 || sep === raw.length - 1) {
    throw new Error(
      `[providers] Malformed model string "${raw}" for role "${ROLE_LABEL[role]}". ` +
      `Expected format: "provider:model-name" (e.g. "openrouter:anthropic/claude-sonnet-4.5"). ` +
      `Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`
    );
  }

  const provider = raw.slice(0, sep).toLowerCase();
  const modelName = raw.slice(sep + 1);

  switch (provider) {
    case 'anthropic':
      return anthropic(modelName);
    case 'google':
      return google(modelName);
    case 'openai':
      return openai(modelName);
    case 'openrouter':
      return openrouter.chat(modelName);
    default:
      throw new Error(
        `[providers] Unknown provider "${provider}" in "${raw}" for role "${ROLE_LABEL[role]}". ` +
        `Supported providers: ${SUPPORTED_PROVIDERS.join(', ')}`
      );
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the language model configured for the given role.
 *
 * Resolution:
 *   1. AI_PROVIDER=mock → mock model (test/CI)
 *   2. Reads env var(s) for the role (first found wins)
 *   3. Throws if no env var is set — no silent fallbacks
 *
 * Required env vars (set all four in .env.local or Vercel):
 *   AI_MODEL_CHAT         — Socratic conversationalist (streaming)
 *   AI_MODEL_SYNTHESIZER  — conversation → neuron extraction
 *   AI_MODEL_INQUISITOR   — prerequisite inference + Architect
 *   AI_MODEL_EVALUATOR    — Bloom cognitive depth classification
 *
 * Format: "provider:model-name"
 * Example: "openrouter:anthropic/claude-sonnet-4.5"
 * Supported providers: openai, anthropic, google, openrouter
 */
export function getModelForRole(role: ModelRole) {
  if (process.env.AI_PROVIDER === 'mock') {
    return mockModel;
  }

  const envKeys = ROLE_ENV[role];
  const raw = envKeys.map((key) => process.env[key]).find(Boolean);

  if (!raw) {
    throw new Error(
      `[providers] No model configured for role "${ROLE_LABEL[role]}". ` +
      `Set ${envKeys[0]} in your .env.local or Vercel environment variables. ` +
      `Example: ${envKeys[0]}=openrouter:anthropic/claude-sonnet-4.5`
    );
  }

  return resolveFromString(raw, role);
}

/** Embeddings always use OpenAI (text-embedding-3-small). */
export function getEmbeddingModel() {
  if (process.env.AI_PROVIDER === 'mock') {
    return mockEmbeddingModel;
  }
  return openai.embedding('text-embedding-3-small');
}
