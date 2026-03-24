import { describe, it, expect } from 'vitest';
import {
  ARCHITECT_SYSTEM_PROMPT,
  BOUNCER_SYSTEM_PROMPT,
  CHAT_SYSTEM_PROMPT,
  MAX_CONTEXT_MESSAGES,
} from '../prompts';

describe('AI Prompts', () => {
  it('should contain critical instructions in system prompt', () => {
    expect(CHAT_SYSTEM_PROMPT).toContain('You are NeuroGraph');
    expect(CHAT_SYSTEM_PROMPT).toContain('Neurogenesis Policy');
    expect(CHAT_SYSTEM_PROMPT).toContain('suggest_neurogenesis');
  });

  it('should encode the teach-then-ask three-step structure', () => {
    // New contract: acknowledge / enrich / question — all three steps must be present
    expect(CHAT_SYSTEM_PROMPT.toLowerCase()).toContain('acknowledge');
    expect(CHAT_SYSTEM_PROMPT.toLowerCase()).toContain('enrich');
    expect(CHAT_SYSTEM_PROMPT).toContain('Question');
    // The old "question-parrot" directive must be gone
    expect(CHAT_SYSTEM_PROMPT).not.toContain('NEVER give direct answers');
  });

  it('should define a strict Bouncer contract', () => {
    expect(BOUNCER_SYSTEM_PROMPT).toContain('NeuroGraph Bouncer');
    expect(BOUNCER_SYSTEM_PROMPT).toContain('append_to_existing');
    expect(BOUNCER_SYSTEM_PROMPT).toContain('allow_new');
    expect(BOUNCER_SYSTEM_PROMPT).toContain('Return JSON only');
  });

  it('should define a strict Architect contract', () => {
    expect(ARCHITECT_SYSTEM_PROMPT).toContain('NeuroGraph Architect');
    expect(ARCHITECT_SYSTEM_PROMPT).toContain('isValid');
    expect(ARCHITECT_SYSTEM_PROMPT).toContain('PREREQUISITE');
    expect(ARCHITECT_SYSTEM_PROMPT).toContain('BUILDS_ON');
    expect(ARCHITECT_SYSTEM_PROMPT).toContain('Return JSON only');
  });

  it('should have correct max context messages', () => {
    expect(MAX_CONTEXT_MESSAGES).toBe(30);
  });
});
