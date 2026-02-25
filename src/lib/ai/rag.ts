import { SupabaseClient } from '@supabase/supabase-js';

import { generateEmbedding } from '@/lib/ai/embeddings';
import { neuronQueries } from '@/lib/db/queries';
import { Neuron, Database } from '@/types/database';

export async function getRelevantContext(
  message: string,
  userId: string,
  client: SupabaseClient<Database>
): Promise<{ ragContext: string; ragCatalog: string }> {
  try {
    const embedding = await generateEmbedding(message);

    const similarNeurons = await neuronQueries.findSimilar(client, embedding, userId, 5, 0.3);

    if (similarNeurons.length === 0) {
      const { data: recentNeurons } = await client
        .from('neurons')
        .select('id, title')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40);

      const ragCatalog =
        recentNeurons && recentNeurons.length > 0
          ? recentNeurons.map((neuron) => `- ${neuron.id}: ${neuron.title}`).join('\n')
          : '- none yet';

      return { ragContext: '', ragCatalog };
    }

    const neighborhoods = await Promise.all(
      similarNeurons.map((neuron) => neuronQueries.getNeighborhood(client, neuron.id, 1))
    );

    const allNeuronsMap = new Map<string, Neuron>();

    similarNeurons.forEach((neuron) => allNeuronsMap.set(neuron.id, neuron));

    neighborhoods.forEach((neighborhood) => {
      neighborhood.neurons.forEach((neuron) => {
        if (!allNeuronsMap.has(neuron.id)) {
          allNeuronsMap.set(neuron.id, neuron);
        }
      });
    });

    const contextLines = similarNeurons.map((neuron, index) => {
      const neighborhood = neighborhoods[index];
      const neighbors = neighborhood.neurons.filter((candidate) => candidate.id !== neuron.id);
      const neighborTitles = neighbors.map((neighbor) => neighbor.title).join(', ');

      return `- Neuron ${neuron.title}: ${neuron.definition} (Neighbors: ${neighborTitles || 'none'})`;
    });

    const ragContext = `\n\n## Relevant Knowledge Context\nYou have previously generated these neurons which are semantically relevant to the current conversation:\n${contextLines.join('\n')}`;

    const ragCatalog = Array.from(allNeuronsMap.values())
      .map((neuron) => `- ${neuron.id}: ${neuron.title}`)
      .join('\n');

    return { ragContext, ragCatalog };
  } catch (error) {
    console.error('RAG error:', error);
    return { ragContext: '', ragCatalog: '- none yet' };
  }
}
