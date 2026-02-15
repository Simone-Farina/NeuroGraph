import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';

/**
 * Generates a vector embedding for the given text using OpenAI's text-embedding-3-small model.
 * Requires OPENAI_API_KEY to be set in environment variables.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: text,
  });

  return embedding;
}
