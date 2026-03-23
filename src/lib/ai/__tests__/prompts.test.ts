import { describe, it, expect } from 'vitest';
import { BOUNCER_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT, MAX_CONTEXT_MESSAGES } from '../prompts';

describe('AI Prompts', () => {
  it('should contain critical instructions in system prompt', () => {
    expect(CHAT_SYSTEM_PROMPT).toContain('You are NeuroGraph');
    expect(CHAT_SYSTEM_PROMPT).toContain('Neurogenesis Policy');
    expect(CHAT_SYSTEM_PROMPT).toContain('suggest_neurogenesis');
  });

  it('should define a strict Bouncer contract', () => {
    expect(BOUNCER_SYSTEM_PROMPT).toContain('NeuroGraph Bouncer');
    expect(BOUNCER_SYSTEM_PROMPT).toContain('append_to_existing');
    expect(BOUNCER_SYSTEM_PROMPT).toContain('allow_new');
    expect(BOUNCER_SYSTEM_PROMPT).toContain('Return JSON only');
  });

  it('should have correct max context messages', () => {
    expect(MAX_CONTEXT_MESSAGES).toBe(30);
  });
});
