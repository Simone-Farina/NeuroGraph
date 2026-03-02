import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { mockModel, mockEmbeddingModel } from '@/lib/ai/mock-provider';

// ─── Role registry ────────────────────────────────────────────────────────────

export type ModelRole = 'chat' | 'synthesis_fast' | 'neurogenesis_heavy' | 'evaluator';

/** Maps each role to its corresponding environment variable name. */
const ROLE_ENV: Record<ModelRole, string> = {
  chat:               'AI_MODEL_CHAT',
  synthesis_fast:     'AI_MODEL_SYNTHESIS_FAST',
  neurogenesis_heavy: 'AI_MODEL_NEUROGENESIS_HEAVY',
  evaluator:          'AI_MODEL_EVALUATOR',
};

/** Safe defaults used when the env var is absent or malformed. */
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
 *   2. Reads AI_MODEL_<ROLE> env var (format "provider:model-name")
 *   3. Falls back to ROLE_DEFAULT if the var is absent or malformed
 */
export function getModelForRole(role: ModelRole) {
  if (process.env.AI_PROVIDER === 'mock') {
    return mockModel;
  }

  const raw = process.env[ROLE_ENV[role]] || ROLE_DEFAULT[role];
  return resolveFromString(raw, role);
}

/** Embeddings always use OpenAI (text-embedding-3-small). */
export function getEmbeddingModel() {
  if (process.env.AI_PROVIDER === 'mock') {
    return mockEmbeddingModel;
  }
  return openai.embedding('text-embedding-3-small');
}
