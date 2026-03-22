import { MockLanguageModelV3, MockEmbeddingModelV3, simulateReadableStream } from 'ai/test';

export const mockEmbeddingModel = new MockEmbeddingModelV3({
  doEmbed: async ({ values }) => ({
    embeddings: values.map(() => {
        // Generate a normalized random vector so cosine similarities are distributed and far below 0.85
        const arr = new Array(1536).fill(0).map(() => Math.random() - 0.5);
        const norm = Math.sqrt(arr.reduce((sum, val) => sum + val * val, 0));
        return arr.map(val => val / norm);
    }),
    usage: { tokens: 10 },
    warnings: [],
  }),
});

export const mockModel = new MockLanguageModelV3({
  doGenerate: async (options) => {
    const promptStr = JSON.stringify(options.prompt);
    
    // Prerequisite Inference Mock (Phase 2)
    if (promptStr.includes('New Neuron:') && promptStr.includes('candidates for prerequisites')) {
      return {
        rawCall: { rawPrompt: null, rawSettings: {} },
        finishReason: 'stop',
        usage: { inputTokens: 50, outputTokens: 30 },
        text: JSON.stringify({
          prerequisites: [],
          suggested_next: [
            { title: "Advanced Topics", reasoning: "Natural next step" }
          ]
        }),
        content: [{ type: 'text', text: JSON.stringify({
          prerequisites: [],
          suggested_next: [
            { title: "Advanced Topics", reasoning: "Natural next step" }
          ]
        }) }],
        warnings: [],
      } as any;
    }

    // Curriculum Generation Mock (Phase 2)
    if (promptStr.includes('Target concept:')) {
      return {
        rawCall: { rawPrompt: null, rawSettings: {} },
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 50 },
        text: JSON.stringify({
          steps: [
            { title: "Foundation Step 1", definition: "A basic concept.", reasoning: "Needed first." },
            { title: "Target Concept", definition: "The final goal.", reasoning: "The destination." }
          ]
        }),
        content: [{ type: 'text', text: JSON.stringify({
          steps: [
            { title: "Foundation Step 1", definition: "A basic concept.", reasoning: "Needed first." },
            { title: "Target Concept", definition: "The final goal.", reasoning: "The destination." }
          ]
        }) }],
        warnings: [],
      } as any;
    }

    // Extraction Mock (Phase 1)
    const isExtract = promptStr.includes('definition, core_insight') || 
      promptStr.includes('NeuroGraph extraction');

    if (isExtract) {
      return {
        rawCall: { rawPrompt: null, rawSettings: {} },
        finishReason: 'stop',
        usage: { inputTokens: 10, outputTokens: 20 },
        text: JSON.stringify({
          definition: "Mock defined concept.",
          core_insight: "Mock core insight extracted from the text.",
          bloom_level: "Understand",
          suggested_synapses: ["Neural Networks", "Deep Learning"]
        }),
        content: [{ type: 'text', text: JSON.stringify({
          definition: "Mock defined concept.",
          core_insight: "Mock core insight extracted from the text.",
          bloom_level: "Understand",
          suggested_synapses: ["Neural Networks", "Deep Learning"]
        }) }],
        warnings: [],
      } as any;
    }

    return {
      rawCall: { rawPrompt: null, rawSettings: {} },
      finishReason: 'stop',
      usage: { inputTokens: 10, outputTokens: 20 },
      content: [{ type: 'text', text: 'Mock response' }],
      warnings: [],
    } as any;
  },
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

    if (userText.toLowerCase().includes('neurogenesis')) {
      const toolCallId = `call_${Math.random().toString(36).slice(2)}`;
      
      let title = 'Spaced Repetition';
      if (userText.includes('Active Recall')) {
        title = 'Active Recall';
      }

      chunks.push({
        type: 'tool-call',
        toolCallId,
        toolName: 'suggest_neurogenesis',
        input: JSON.stringify({
          title,
          definition: 'A learning technique that reviews information at increasing intervals.',
          core_insight: 'Spaced repetition combats the forgetting curve by spacing out reviews.',
          bloom_level: 'Analyze',
          related_neurons: []
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
