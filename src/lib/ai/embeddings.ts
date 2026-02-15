import { embed } from 'ai';
import { getEmbeddingModel } from './providers';

export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: getEmbeddingModel(),
    value: text,
  });

  return embedding;
}
