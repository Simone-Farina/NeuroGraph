import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { mockModel, mockEmbeddingModel } from '@/lib/ai/mock-provider';

type ProviderName = 'openai' | 'anthropic' | 'google' | 'mock';

const DEFAULT_PROVIDER: ProviderName = 'openai';

function getProviderName(): ProviderName {
  const value = process.env.AI_PROVIDER?.toLowerCase();

  if (value === 'anthropic' || value === 'google' || value === 'openai' || value === 'mock') {
    return value as ProviderName;
  }

  return DEFAULT_PROVIDER;
}

export function getChatModel() {
  const provider = getProviderName();

  switch (provider) {
    case 'mock':
      return mockModel;
    case 'anthropic':
      return anthropic('claude-3-5-sonnet-latest');
    case 'google':
      return google('gemini-1.5-pro-latest');
    case 'openai':
    default:
      return openai('gpt-4o');
  }
}

export function getSynthesisModel() {
  const provider = getProviderName();

  switch (provider) {
    case 'mock':
      return mockModel;
    case 'anthropic':
      return anthropic('claude-haiku-4-5-20251001');
    case 'google':
      return google('gemini-2.0-flash');
    case 'openai':
    default:
      return openai('gpt-4o-mini');
  }
}

export function getEmbeddingModel() {
  const provider = getProviderName();
  
  if (provider === 'mock') {
    return mockEmbeddingModel;
  }
  
  return openai.embedding('text-embedding-3-small');
}
