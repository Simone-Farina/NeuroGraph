import { z } from 'zod';

/** Validates an incoming bearer token format: ng_ prefix + 48 alphanumeric chars */
export const RawApiKeySchema = z.string()
  .regex(/^ng_[A-Za-z0-9]{48}$/, 'Invalid API key format');

export type RawApiKey = z.infer<typeof RawApiKeySchema>;
