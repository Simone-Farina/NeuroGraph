// ─── Agent Role Registry ──────────────────────────────────────────────────────
// Single source of truth for all AI agent roles, their env var names, and
// default model strings.
//
// Format: provider:model-name  (e.g. openai:gpt-4o-mini, google:gemini-2.5-flash)
// Supported providers: openai | anthropic | google | openrouter
//
// Override at runtime by setting the corresponding env var in .env.local.

export const AI_AGENTS = {
  conversationalist: { env: 'AI_MODEL_CHAT',         default: 'openai:gpt-4o' },
  bloomEvaluator:    { env: 'AI_MODEL_EVALUATOR',    default: 'google:gemini-2.5-flash' },
  synthesizer:       { env: 'AI_MODEL_SYNTHESIZER',  default: 'openai:gpt-4o-mini' },
  inquisitor:        { env: 'AI_MODEL_INQUISITOR',   default: 'openrouter:anthropic/claude-3.5-sonnet' },
} as const;

export type AgentRole = keyof typeof AI_AGENTS;
