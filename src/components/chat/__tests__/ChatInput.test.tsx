import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatInput } from '../ChatInput';

describe('ChatInput', () => {
  const mockOnChange = vi.fn();
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <ChatInput
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        disabled={false}
      />
    );

    // Check if textarea exists
    const textarea = screen.getByPlaceholderText('Ask a question or explore an idea...');
    expect(textarea).toBeInTheDocument();

    // Check if button exists (we'll look for it by title for now, as aria-label is missing)
    const button = screen.getByTitle('Send Message');
    expect(button).toBeInTheDocument();
  });

  it('calls onChange when typing', () => {
    render(
      <ChatInput
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        disabled={false}
      />
    );

    const textarea = screen.getByPlaceholderText('Ask a question or explore an idea...');
    fireEvent.change(textarea, { target: { value: 'Hello' } });

    expect(mockOnChange).toHaveBeenCalledWith('Hello');
  });

  it('calls onSubmit when clicking send button with text', () => {
    render(
      <ChatInput
        value="Hello"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        disabled={false}
      />
    );

    const button = screen.getByTitle('Send Message');
    fireEvent.click(button);

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('does not call onSubmit when empty', () => {
    render(
      <ChatInput
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        disabled={false}
      />
    );

    const button = screen.getByTitle('Send Message');
    // In JSDOM/fireEvent, click events can still fire on disabled buttons depending on version/config.
    // However, the button should be disabled, which prevents user interaction in browsers.
    expect(button).toBeDisabled();
  });

  it('calls onSubmit on Enter key', () => {
    render(
      <ChatInput
        value="Hello"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        disabled={false}
      />
    );

    const textarea = screen.getByPlaceholderText('Ask a question or explore an idea...');
    fireEvent.keyDown(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });

    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('does not call onSubmit on Shift+Enter', () => {
    render(
      <ChatInput
        value="Hello"
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        disabled={false}
      />
    );

    const textarea = screen.getByPlaceholderText('Ask a question or explore an idea...');
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true, code: 'Enter', charCode: 13 });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // This test expects accessibility improvements
  it('has accessible labels', () => {
    render(
      <ChatInput
        value=""
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        disabled={false}
      />
    );

    // These will fail currently
    expect(screen.getByLabelText('Message input')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('shows loading spinner when sending', () => {
    // disabled=true and value present = loading/sending
    render(
      <ChatInput
        value="Sending this..."
        onChange={mockOnChange}
        onSubmit={mockOnSubmit}
        disabled={true}
      />
    );

    // Should have "animate-spin" class on SVG
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toHaveClass('animate-spin');
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
