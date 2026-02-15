import { describe, it, expect } from 'vitest';
import { CHAT_SYSTEM_PROMPT, MAX_CONTEXT_MESSAGES } from '../prompts';

describe('AI Prompts', () => {
  it('should contain critical instructions in system prompt', () => {
    expect(CHAT_SYSTEM_PROMPT).toContain('You are NeuroGraph');
    expect(CHAT_SYSTEM_PROMPT).toContain('Crystallization Policy');
    expect(CHAT_SYSTEM_PROMPT).toContain('suggest_crystallization');
  });

  it('should have correct max context messages', () => {
    expect(MAX_CONTEXT_MESSAGES).toBe(30);
  });
});
