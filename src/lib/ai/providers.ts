import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

type ProviderName = 'openai' | 'anthropic' | 'google';

const DEFAULT_PROVIDER: ProviderName = 'openai';

function getProviderName(): ProviderName {
  const value = process.env.AI_PROVIDER?.toLowerCase();

  if (value === 'anthropic' || value === 'google' || value === 'openai') {
    return value;
  }

  return DEFAULT_PROVIDER;
}

export function getChatModel() {
  const provider = getProviderName();

  switch (provider) {
    case 'anthropic':
      return anthropic('claude-3-5-sonnet-latest');
    case 'google':
      return google('gemini-1.5-pro-latest');
    case 'openai':
    default:
      return openai('gpt-4o');
  }
}
