import { MockLanguageModelV3, MockEmbeddingModelV3, simulateReadableStream } from 'ai/test';

export const mockEmbeddingModel = new MockEmbeddingModelV3({
  doEmbed: async ({ values }) => ({
    embeddings: values.map(() => {
        const arr = new Array(1536).fill(0.001);
        arr[0] = 0.1 + (Math.random() * 0.01);
        return arr;
    }),
    usage: { tokens: 10 },
    warnings: [],
  }),
});

export const mockModel = new MockLanguageModelV3({
  doGenerate: async () => ({
    rawCall: { rawPrompt: null, rawSettings: {} },
    finishReason: 'stop',
    usage: { inputTokens: 10, outputTokens: 20 },
    content: [{ type: 'text', text: 'Mock response' }],
    warnings: [],
  } as any),
  doStream: async ({ prompt }) => {
    const lastMessage = prompt[prompt.length - 1];
    
    let userText = '';
    if (Array.isArray(lastMessage.content)) {
      userText = lastMessage.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('');
    } else if (typeof lastMessage.content === 'string') {
      userText = lastMessage.content;
    }

    const chunks: any[] = [];

    if (userText.toLowerCase().includes('crystallize')) {
      const toolCallId = `call_${Math.random().toString(36).slice(2)}`;
      
      let title = 'Spaced Repetition';
      if (userText.includes('Active Recall')) {
        title = 'Active Recall';
      }

      chunks.push({
        type: 'tool-call',
        toolCallId,
        toolName: 'suggest_crystallization',
        input: JSON.stringify({
          title,
          definition: 'A learning technique that reviews information at increasing intervals.',
          core_insight: 'Spaced repetition combats the forgetting curve by spacing out reviews.',
          bloom_level: 'Analyze',
          related_crystals: []
        }),
      });
      
      chunks.push({
        type: 'finish',
        finishReason: 'tool-calls',
        usage: { inputTokens: 10, outputTokens: 50 },
      });
    } else {
      chunks.push({
        type: 'text-start',
        id: 'chunk_1',
      });
      
      chunks.push({
        type: 'text-delta',
        id: 'chunk_1',
        delta: `This is a mock response about: ${userText}. Spaced repetition is great.`,
      });
      
      chunks.push({
        type: 'finish',
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 20 },
      });
    }

    return {
      stream: simulateReadableStream({ chunks }),
      rawCall: { rawPrompt: null, rawSettings: {} },
      warnings: [],
    };
  },
});
