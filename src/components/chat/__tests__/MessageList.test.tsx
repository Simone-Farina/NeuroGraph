import { render, renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useGraphStore } from '@/stores/graphStore';

// These imports will resolve after Task 2 adds the exports
import { renderHighlightedText, bloomToHighlightClass, useBloomHighlight } from '../MessageList';

describe('bloomToHighlightClass', () => {
  it('returns correct class for each Bloom level', () => {
    expect(bloomToHighlightClass('Remember')).toBe('bg-sky-400/10');
    expect(bloomToHighlightClass('Understand')).toBe('bg-teal-400/10');
    expect(bloomToHighlightClass('Apply')).toBe('bg-emerald-400/10');
    expect(bloomToHighlightClass('Analyze')).toBe('bg-amber-400/15');
    expect(bloomToHighlightClass('Evaluate')).toBe('bg-orange-400/15');
    expect(bloomToHighlightClass('Create')).toBe('bg-yellow-300/15');
  });

  it('returns empty string for null or unknown level', () => {
    expect(bloomToHighlightClass(null)).toBe('');
    expect(bloomToHighlightClass('Unknown')).toBe('');
  });
});

describe('renderHighlightedText', () => {
  it('returns highlighted spans for matching phrases when isHighlighted is true', () => {
    const { container } = render(
      <div>{renderHighlightedText(
        'The tradeoff between SQL and NoSQL shifts when joins become the bottleneck',
        ['joins become the bottleneck'],
        true,
        'bg-amber-400/15'
      )}</div>
    );
    const highlightedSpan = container.querySelector('.bg-amber-400\\/15');
    expect(highlightedSpan).not.toBeNull();
    expect(highlightedSpan?.textContent).toBe('joins become the bottleneck');
  });

  it('returns spans without highlight class when isHighlighted is false', () => {
    const { container } = render(
      <div>{renderHighlightedText(
        'The tradeoff between SQL and NoSQL',
        ['tradeoff'],
        false,
        'bg-amber-400/15'
      )}</div>
    );
    // Spans are still in the DOM (for CSS transition), but without the highlight class
    const highlightedSpan = container.querySelector('.bg-amber-400\\/15');
    expect(highlightedSpan).toBeNull();
    // The matched phrase is still wrapped in a span
    const spans = container.querySelectorAll('span');
    expect(spans.length).toBeGreaterThan(0);
    expect(container.textContent).toBe('The tradeoff between SQL and NoSQL');
  });

  it('returns plain text string when phrases array is empty', () => {
    const result = renderHighlightedText(
      'Some text here',
      [],
      true,
      'bg-amber-400/15'
    );
    expect(result).toBe('Some text here');
  });

  it('handles case-insensitive matching', () => {
    const { container } = render(
      <div>{renderHighlightedText(
        'Comparing SQL versus NoSQL',
        ['comparing sql'],
        true,
        'bg-sky-400/10'
      )}</div>
    );
    const highlightedSpan = container.querySelector('.bg-sky-400\\/10');
    expect(highlightedSpan).not.toBeNull();
    expect(highlightedSpan?.textContent?.toLowerCase()).toBe('comparing sql');
  });

  it('escapes regex metacharacters in phrases', () => {
    const { container } = render(
      <div>{renderHighlightedText(
        'cost is $100 (estimated)',
        ['$100 (estimated)'],
        true,
        'bg-teal-400/10'
      )}</div>
    );
    const highlightedSpan = container.querySelector('.bg-teal-400\\/10');
    expect(highlightedSpan).not.toBeNull();
    expect(highlightedSpan?.textContent).toBe('$100 (estimated)');
  });
});

describe('useBloomHighlight', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useGraphStore.setState({
      bloomLevel: null,
      bloomConfidence: 0,
      isBloomPending: false,
      bloomKeyPhrases: [],
      latestBloomMessageId: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sets isHighlighted to true when bloomKeyPhrases becomes non-empty', () => {
    const { result } = renderHook(() => useBloomHighlight());
    expect(result.current.isHighlighted).toBe(false);

    act(() => {
      useGraphStore.setState({ bloomKeyPhrases: ['some phrase'], latestBloomMessageId: 'msg-1', bloomLevel: 'Analyze' });
    });

    expect(result.current.isHighlighted).toBe(true);
  });

  it('sets isHighlighted to false after 5 seconds', () => {
    const { result } = renderHook(() => useBloomHighlight());

    act(() => {
      useGraphStore.setState({ bloomKeyPhrases: ['some phrase'], latestBloomMessageId: 'msg-1', bloomLevel: 'Analyze' });
    });

    expect(result.current.isHighlighted).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.isHighlighted).toBe(false);
  });

  it('sets isHighlighted to false immediately when bloomKeyPhrases becomes empty', () => {
    const { result } = renderHook(() => useBloomHighlight());

    act(() => {
      useGraphStore.setState({ bloomKeyPhrases: ['phrase'], latestBloomMessageId: 'msg-1', bloomLevel: 'Apply' });
    });
    expect(result.current.isHighlighted).toBe(true);

    // Simulate conversation switch — resetBloomEval clears phrases
    act(() => {
      useGraphStore.setState({ bloomKeyPhrases: [], latestBloomMessageId: null, bloomLevel: null });
    });
    expect(result.current.isHighlighted).toBe(false);
  });

  it('clears previous timer when new phrases arrive before 5s elapsed', () => {
    const { result } = renderHook(() => useBloomHighlight());

    act(() => {
      useGraphStore.setState({ bloomKeyPhrases: ['phrase A'], latestBloomMessageId: 'msg-1', bloomLevel: 'Remember' });
    });

    // Advance 3 seconds (not yet expired)
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.isHighlighted).toBe(true);

    // New evaluation arrives — resets timer
    act(() => {
      useGraphStore.setState({ bloomKeyPhrases: ['phrase B'], latestBloomMessageId: 'msg-2', bloomLevel: 'Create' });
    });
    expect(result.current.isHighlighted).toBe(true);

    // Advance 3 more seconds (6s since first, 3s since second) — should still be highlighted
    act(() => { vi.advanceTimersByTime(3000); });
    expect(result.current.isHighlighted).toBe(true);

    // Advance 2 more seconds (5s since second set) — now it should fade
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.isHighlighted).toBe(false);
  });
});
