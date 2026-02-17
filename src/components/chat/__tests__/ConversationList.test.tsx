import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationList } from '../ConversationList';
import { vi, describe, it, expect } from 'vitest';
import type { ConversationSummary } from '@/types/chat';

// Mock ConversationSummary
const mockConversations: ConversationSummary[] = [
  {
    id: '1',
    title: 'Test Conversation 1',
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Test Conversation 2',
    updated_at: new Date().toISOString(),
  },
];

describe('ConversationList', () => {
  it('renders conversations and delete button with accessibility improvements', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    const onNew = vi.fn();

    render(
      <ConversationList
        conversations={mockConversations}
        currentId={null}
        onSelect={onSelect}
        onDelete={onDelete}
        onNew={onNew}
      />
    );

    // Check if delete button exists and has aria-label
    // Initially, it might not have aria-label, so this test expects to fail or pass if implemented
    const deleteButtons = screen.getAllByTitle('Delete conversation');
    expect(deleteButtons.length).toBe(2);

    deleteButtons.forEach((button) => {
      // Check for aria-label
      expect(button).toHaveAttribute('aria-label', 'Delete conversation');

      // Check for focus:opacity-100 class
      expect(button.className).toContain('focus:opacity-100');
    });
  });

  it('calls onDelete when delete button is clicked', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    const onNew = vi.fn();

    render(
      <ConversationList
        conversations={mockConversations}
        currentId={null}
        onSelect={onSelect}
        onDelete={onDelete}
        onNew={onNew}
      />
    );

    const deleteButton = screen.getAllByTitle('Delete conversation')[0];
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(expect.anything(), '1');
  });
});
