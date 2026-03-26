import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { mockModel, mockEmbeddingModel } from '@/lib/ai/mock-provider';

import { AI_AGENTS } from './config';

// Re-export AgentRole for consumers that import the type from providers.ts
export type { AgentRole } from './config';

// ─── Core resolver ────────────────────────────────────────────────────────────

function resolveFromString(raw: string, role: string) {
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
    case 'openrouter': {
      const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
      return openrouter(modelName);
    }
    default:
      console.warn(
        `[providers] Unknown provider "${provider}" in "${raw}" for role "${role}" — falling back to gpt-4o-mini`
      );
      return openai('gpt-4o-mini');
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the language model configured for the given agent role.
 *
 * Resolution order:
 *   1. If AI_PROVIDER=mock → returns the shared mock model (test/CI mode)
 *   2. Reads the role's env var (format "provider:model-name")
 *   3. Falls back to the role's default if the var is absent or malformed
 *
 * Logs the resolved model at call time so the founder can see which model
 * is active: [ai] <role> → <model-string>
 */
export function getModelForRole(role: keyof typeof AI_AGENTS) {
  if (process.env.AI_PROVIDER === 'mock') {
    return mockModel;
  }

  const agent = AI_AGENTS[role];
  const raw = process.env[agent.env] || agent.default;
  console.log(`[ai] ${role} → ${raw}`);
  return resolveFromString(raw, role);
}

/** Embeddings always use OpenAI (text-embedding-3-small). */
export function getEmbeddingModel() {
  if (process.env.AI_PROVIDER === 'mock') {
    return mockEmbeddingModel;
  }
  return openai.embedding('text-embedding-3-small');
}
