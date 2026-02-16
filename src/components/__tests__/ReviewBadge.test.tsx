import { render, screen, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReviewBadge } from '../ReviewBadge';

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('ReviewBadge', () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially', async () => {
    // Mock fetch to delay response
    fetchMock.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({
      ok: true,
      json: async () => ({ reviews: [] })
    }), 100)));

    const { container } = render(<ReviewBadge />);

    // Check for loading indicator (pulsing dot)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders nothing when no reviews are due', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ reviews: [] }),
    });

    const { container } = render(<ReviewBadge />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // Component should return null when not loading and count is 0
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('renders review count when reviews are due', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ reviews: [1, 2, 3] }),
    });

    render(<ReviewBadge />);

    // Wait for count to appear
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    // Check link href
    const link = screen.getByRole('link', { name: /review/i });
    expect(link).toHaveAttribute('href', '/app/review');

    // Check if "Review" text is present
    expect(screen.getByText(/review/i)).toBeInTheDocument();
  });

  it('refetches on window focus', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ reviews: [] }),
    });

    render(<ReviewBadge />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // Trigger window focus
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  it('handles API error gracefully', async () => {
    // Mock fetch to reject
    fetchMock.mockRejectedValue(new Error('API Error'));

    // Spy on console.error to suppress error logging during test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { container } = render(<ReviewBadge />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // Component should handle error by setting loading to false, count remains 0 -> renders null
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch review count:', expect.any(Error));
    consoleSpy.mockRestore();
  });
});
