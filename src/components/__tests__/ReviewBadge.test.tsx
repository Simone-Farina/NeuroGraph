import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewBadge } from '../ReviewBadge';

// Mock the global fetch function
global.fetch = vi.fn();

describe('ReviewBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    // Mock fetch to delay response so we can inspect loading state
    (global.fetch as any).mockImplementationOnce(() => new Promise(() => {}));

    const { container } = render(<ReviewBadge />);

    // Check for "Review" text which is present during loading
    expect(screen.getByText('Review')).toBeInTheDocument();

    // Check for loading indicator
    // The loading indicator is a div with animate-pulse class
    const loadingIndicator = container.querySelector('.animate-pulse');
    expect(loadingIndicator).toBeInTheDocument();
  });

  it('renders review count when reviews are available', async () => {
    const mockReviews = [
      { id: 1, title: 'Review 1' },
      { id: 2, title: 'Review 2' },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    const { container } = render(<ReviewBadge />);

    // Wait for the count to be displayed
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Loading indicator should be gone
    const loadingIndicator = container.querySelector('.animate-pulse');
    expect(loadingIndicator).not.toBeInTheDocument();
  });

  it('renders nothing when there are no reviews', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: [] }),
    });

    const { container } = render(<ReviewBadge />);

    // Wait for the component to update
    await waitFor(() => {
      // The component returns null when count is 0 and loading is false
      expect(container.firstChild).toBeNull();
    });
  });

  it('handles fetch error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { container } = render(<ReviewBadge />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch review count:', expect.any(Error));
    });

    // Should render nothing on error (as count remains 0)
    expect(container.firstChild).toBeNull();

    consoleSpy.mockRestore();
  });
});
