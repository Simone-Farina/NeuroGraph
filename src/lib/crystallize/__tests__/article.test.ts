import { describe, expect, it } from 'vitest';

import { classifyExtractionFailure } from '../article';
import { renderCrystallizeAssistantMessage } from '../seed';

describe('classifyExtractionFailure', () => {
  it('returns empty for short extracted content', () => {
    expect(
      classifyExtractionFailure({
        content: 'Short content that does not meet the minimum extraction threshold.',
      })
    ).toBe('empty');
  });

  it('returns timeout for timeout-like failures', () => {
    expect(
      classifyExtractionFailure({
        error: new Error('The operation timed out while fetching the article'),
      })
    ).toBe('timeout');
  });

  it('returns paywall for paywall-like failures', () => {
    expect(
      classifyExtractionFailure({
        error: new Error('Received 403 forbidden from publisher paywall'),
      })
    ).toBe('paywall');
  });
});

describe('renderCrystallizeAssistantMessage', () => {
  it('renders title, source, briefing, optional queue notes, and question in order', () => {
    expect(
      renderCrystallizeAssistantMessage({
        sourceTitle: 'A Better Way to Learn',
        sourceDomainOrUrl: 'example.com',
        briefing:
          'This article argues that active recall outperforms passive review when the learner must generate explanations from memory. It also emphasizes that small, repeated retrieval sessions build durable understanding faster than rereading.',
        openingQuestion:
          'Where in your current workflow are you still relying on passive review instead of retrieval?',
        notes: 'Compare this against the current queue triage heuristics.',
      })
    ).toBe(
      [
        'A Better Way to Learn',
        'example.com',
        '',
        'This article argues that active recall outperforms passive review when the learner must generate explanations from memory. It also emphasizes that small, repeated retrieval sessions build durable understanding faster than rereading.',
        '',
        'Queue note: Compare this against the current queue triage heuristics.',
        '',
        'Question: Where in your current workflow are you still relying on passive review instead of retrieval?',
      ].join('\n')
    );
  });

  it('falls back to the URL when a domain is unavailable and omits queue notes when absent', () => {
    expect(
      renderCrystallizeAssistantMessage({
        sourceTitle: 'Manual Paste Session',
        sourceDomainOrUrl: 'https://example.com/manual',
        briefing:
          'The pasted source explains why concept compression matters before turning notes into reusable knowledge. It recommends one sharp framing question to open the exchange.',
        openingQuestion: 'What should be clarified before this becomes a neuron?',
        notes: null,
      })
    ).toBe(
      [
        'Manual Paste Session',
        'https://example.com/manual',
        '',
        'The pasted source explains why concept compression matters before turning notes into reusable knowledge. It recommends one sharp framing question to open the exchange.',
        '',
        'Question: What should be clarified before this becomes a neuron?',
      ].join('\n')
    );
  });
});
