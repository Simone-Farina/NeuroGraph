import { SupabaseClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/ai/embeddings';
import { crystalQueries } from '@/lib/db/queries';
import { Crystal, Database } from '@/types/database';

export async function getRelevantContext(
  message: string,
  userId: string,
  client: SupabaseClient<Database>
): Promise<{ ragContext: string; ragCatalog: string }> {
  try {
    const embedding = await generateEmbedding(message);
    
    const similarCrystals = await crystalQueries.findSimilar(
      client,
      embedding,
      userId,
      5,
      0.3
    );

    if (similarCrystals.length === 0) {
      const { data: recentCrystals } = await client
        .from('crystals')
        .select('id, title')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40);

      const ragCatalog = recentCrystals && recentCrystals.length > 0
        ? recentCrystals.map(c => `- ${c.id}: ${c.title}`).join('\n')
        : '- none yet';

      return { ragContext: '', ragCatalog };
    }

    const neighborhoods = await crystalQueries.getNeighborhoodsBatch(
      client,
      similarCrystals.map(crystal => crystal.id)
    );
    
    const allCrystalsMap = new Map<string, Crystal>();
    
    similarCrystals.forEach(c => allCrystalsMap.set(c.id, c));
    
    neighborhoods.forEach(n => {
      n.crystals.forEach(c => {
        if (!allCrystalsMap.has(c.id)) {
          allCrystalsMap.set(c.id, c);
        }
      });
    });

    const contextLines = similarCrystals.map((crystal, index) => {
      const neighborhood = neighborhoods[index];
      const neighbors = neighborhood.crystals.filter(c => c.id !== crystal.id);
      const neighborTitles = neighbors.map(n => n.title).join(', ');
      
      return `- Crystal ${crystal.title}: ${crystal.definition} (Neighbors: ${neighborTitles || 'none'})`;
    });

    const ragContext = `\n\n## Relevant Knowledge Context\nYou have previously crystallized these insights which are semantically relevant to the current conversation:\n${contextLines.join('\n')}`;
    
    const ragCatalog = Array.from(allCrystalsMap.values())
      .map(c => `- ${c.id}: ${c.title}`)
      .join('\n');

    return { ragContext, ragCatalog };
  } catch (error) {
    console.error('RAG error:', error);
    return { ragContext: '', ragCatalog: '- none yet' };
  }
}
