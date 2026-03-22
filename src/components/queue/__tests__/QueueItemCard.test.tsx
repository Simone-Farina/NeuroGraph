import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { QueueItemCard } from '../QueueItemCard';

const BASE_ITEM = {
  id: 'item-1',
  user_id: 'user-1',
  title: 'Readable article',
  url: 'https://example.com/article',
  notes: 'A quiet note.',
  state: 'inbox' as const,
  source_domain: 'example.com',
  favicon_url: null,
  estimated_read_time: 8,
  created_at: '2026-03-12T12:00:00Z',
  updated_at: '2026-03-12T12:00:00Z',
};

describe('QueueItemCard', () => {
  it('renders subtle inline actions and opens the external URL callback', () => {
    const onOpenUrl = vi.fn();

    render(<QueueItemCard item={BASE_ITEM} onOpenUrl={onOpenUrl} />);

    expect(screen.getByRole('button', { name: 'Archive as Resource' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark as Read' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Crystallize' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /open readable article/i }));
    expect(onOpenUrl).toHaveBeenCalledWith(BASE_ITEM);
  });

  it('uses rust styling only for aged passive debt items', () => {
    render(
      <QueueItemCard
        item={{
          ...BASE_ITEM,
          state: 'passive_debt',
        }}
      />
    );

    expect(screen.getByText('10 days ago')).toHaveAttribute('data-rusty', 'true');
    expect(screen.queryByRole('button', { name: 'Archive as Resource' })).not.toBeInTheDocument();
  });

  it('does not show passive-debt-only actions on resource items', () => {
    render(
      <QueueItemCard
        item={{
          ...BASE_ITEM,
          state: 'resource',
        }}
      />
    );

    expect(screen.queryByRole('button', { name: 'Archive as Resource' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Return to Passive Debt' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Crystallize' })).not.toBeInTheDocument();
  });

  it('requires an explicit second click before deleting and disables actions while pending', () => {
    const onDelete = vi.fn();

    render(
      <QueueItemCard
        item={BASE_ITEM}
        pendingState="transition"
        onDelete={onDelete}
      />
    );

    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('shows delete confirmation copy before firing the destructive action', () => {
    const onDelete = vi.fn();

    render(<QueueItemCard item={BASE_ITEM} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('button', { name: 'Confirm Delete' })).toBeInTheDocument();
    expect(screen.getByText('Second click deletes this item permanently.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Delete' }));
    expect(onDelete).toHaveBeenCalledWith(BASE_ITEM);
  });
});
