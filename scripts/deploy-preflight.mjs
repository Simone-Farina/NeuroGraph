#!/usr/bin/env node

const requiredAlways = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'OPENAI_API_KEY',
];

const validProviders = new Set(['openai', 'anthropic', 'google', 'mock']);
const providerRaw = process.env.AI_PROVIDER ?? 'openai';
const provider = providerRaw.toLowerCase();

const missing = [];

for (const key of requiredAlways) {
  if (!process.env[key]) {
    missing.push(key);
  }
}

if (!validProviders.has(provider)) {
  console.error(`Invalid AI_PROVIDER: "${providerRaw}".`);
  console.error('Valid values: openai, anthropic, google, mock');
  process.exit(1);
}

if (provider === 'anthropic' && !process.env.ANTHROPIC_API_KEY) {
  missing.push('ANTHROPIC_API_KEY');
}

if (provider === 'google' && !process.env.GOOGLE_API_KEY) {
  missing.push('GOOGLE_API_KEY');
}

if (!process.env.NEXT_PUBLIC_APP_URL) {
  console.warn('Warning: NEXT_PUBLIC_APP_URL is not set.');
  console.warn('Set it to your Vercel URL for production links and callbacks.');
}

if (provider === 'mock') {
  console.warn('Warning: AI_PROVIDER=mock is intended for local test environments.');
}

if (missing.length > 0) {
  console.error('\nDeployment preflight failed. Missing environment variables:');
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

console.log('Deployment preflight passed. Required environment variables are set.');
