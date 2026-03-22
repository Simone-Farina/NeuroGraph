import { extract } from '@extractus/article-extractor';

import type { CrystallizeFailureReason } from '@/lib/crystallize/types';

const MIN_CONTENT_LENGTH = 400;
const PAYWALL_PATTERNS = [
  'paywall',
  'subscribe to continue',
  'subscription required',
  'subscriber-only',
  'members only',
  'premium content',
  '403',
  '401',
  'forbidden',
  'unauthorized',
];

function normalizeContent(content: string | null | undefined) {
  if (typeof content !== 'string') {
    return null;
  }

  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalized || null;
}

function getSourceDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message.toLowerCase();
  }

  if (typeof error === 'string') {
    return error.toLowerCase();
  }

  return '';
}

export async function extractCrystallizeSource(url: string): Promise<{
  title: string | null;
  content: string | null;
  url: string;
  domain: string | null;
}> {
  const article = await extract(
    url,
    {
      contentLengthThreshold: MIN_CONTENT_LENGTH,
    },
    {
      signal: AbortSignal.timeout(8000),
    }
  );

  return {
    title: article?.title?.trim() || null,
    content: normalizeContent(article?.content),
    url,
    domain: getSourceDomain(url),
  };
}

export function classifyExtractionFailure(input: {
  error?: unknown;
  content?: string | null;
}): CrystallizeFailureReason {
  const normalizedContent = normalizeContent(input.content);

  if (!normalizedContent || normalizedContent.length < MIN_CONTENT_LENGTH) {
    if (!input.error) {
      return 'empty';
    }
  }

  const message = getErrorMessage(input.error);

  if (!message) {
    return 'empty';
  }

  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('aborted') ||
    message.includes('aborterror')
  ) {
    return 'timeout';
  }

  if (PAYWALL_PATTERNS.some((pattern) => message.includes(pattern))) {
    return 'paywall';
  }

  return 'unsupported';
}
