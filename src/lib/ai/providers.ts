import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { createOpenAI, openai } from '@ai-sdk/openai';
import { mockModel, mockEmbeddingModel } from '@/lib/ai/mock-provider';

// ─── OpenRouter (OpenAI-compatible) ──────────────────────────────────────────

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? '',
});

// ─── Role registry ────────────────────────────────────────────────────────────

export type ModelRole = 'chat' | 'synthesis_fast' | 'neurogenesis_heavy' | 'evaluator';

/**
 * Maps each role to its environment variable name(s).
 * First entry is the canonical name, second is a legacy alias.
 */
const ROLE_ENV: Record<ModelRole, string[]> = {
  chat:               ['AI_MODEL_CHAT'],
  synthesis_fast:     ['AI_MODEL_SYNTHESIZER', 'AI_MODEL_SYNTHESIS_FAST'],
  neurogenesis_heavy: ['AI_MODEL_INQUISITOR', 'AI_MODEL_NEUROGENESIS_HEAVY'],
  evaluator:          ['AI_MODEL_EVALUATOR'],
};

/** Safe defaults used when no env var is set. */
const ROLE_DEFAULT: Record<ModelRole, string> = {
  chat:               'openai:gpt-4o',
  synthesis_fast:     'openai:gpt-4o-mini',
  neurogenesis_heavy: 'openai:gpt-4o',
  evaluator:          'openai:gpt-4o-mini',
};

// ─── Core resolver ────────────────────────────────────────────────────────────

function resolveFromString(raw: string, role: ModelRole) {
  const sep = raw.indexOf(':');

  if (sep <= 0 || sep === raw.length - 1) {
    console.warn(
      `[providers] Malformed model string "${raw}" for role "${role}" — falling back to gpt-4o-mini`
    );
    return openai('gpt-4o-mini');
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
      return openrouter(modelName);
    default:
      console.warn(
        `[providers] Unknown provider "${provider}" in "${raw}" for role "${role}" — falling back to gpt-4o-mini`
      );
      return openai('gpt-4o-mini');
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the language model configured for the given role.
 *
 * Resolution order:
 *   1. If AI_PROVIDER=mock → returns the shared mock model (test/CI mode)
 *   2. Reads env vars in priority order (e.g. AI_MODEL_SYNTHESIZER, then AI_MODEL_SYNTHESIS_FAST)
 *   3. Falls back to ROLE_DEFAULT if no var is set
 *
 * Supported provider prefixes: openai, anthropic, google, openrouter
 * OpenRouter format: "openrouter:anthropic/claude-sonnet-4.5"
 */
export function getModelForRole(role: ModelRole) {
  if (process.env.AI_PROVIDER === 'mock') {
    return mockModel;
  }

  const envKeys = ROLE_ENV[role];
  const raw = envKeys.map((key) => process.env[key]).find(Boolean) || ROLE_DEFAULT[role];
  return resolveFromString(raw, role);
}

/** Embeddings always use OpenAI (text-embedding-3-small). */
export function getEmbeddingModel() {
  if (process.env.AI_PROVIDER === 'mock') {
    return mockEmbeddingModel;
  }
  return openai.embedding('text-embedding-3-small');
}
