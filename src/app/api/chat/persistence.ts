import { SupabaseClient } from '@supabase/supabase-js';

export async function persistAssistantMessage(
  supabase: SupabaseClient,
  conversationId: string,
  content: string
) {
  if (!content.trim() || !conversationId) return;

  try {
    const { error } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      role: 'assistant',
      content,
    });

    if (error) {
      console.error(
        'Failed to persist assistant message. Error Code:',
        error.code
      );
    }
  } catch (err) {
    console.error('Failed to persist assistant message: An unexpected error occurred.');
  }
}
