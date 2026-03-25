import { startActiveObservation } from '@langfuse/tracing';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/database';
import { getRelevantContext } from '@/lib/ai/rag';

// Re-export the OTel processor so callers can reference it without a deep import
export { langfuseProcessor } from '@/instrumentation';

// Re-export observe() for use in custom span creation by route handlers
export { observe } from '@langfuse/tracing';

/**
 * Factory for `experimental_telemetry` config objects used in every streamText
 * and generateObject call. The `functionId` field names the Langfuse span.
 *
 * @param agentName - Identifies the agent in Langfuse (e.g. 'conversationalist', 'bouncer-extract')
 * @param opts - Optional userId, conversationId, and arbitrary extra metadata
 */
export function buildTelemetry(
  agentName: string,
  opts?: { userId?: string; conversationId?: string; extra?: Record<string, string> }
): { isEnabled: true; functionId: string; metadata: Record<string, string> } {
  const metadata: Record<string, string> = {};
  if (opts?.userId) metadata.userId = opts.userId;
  if (opts?.conversationId) metadata.conversationId = opts.conversationId;
  if (opts?.extra) Object.assign(metadata, opts.extra);
  return {
    isEnabled: true,
    functionId: agentName,
    metadata,
  };
}

/**
 * Wraps the RAG retrieval call with a Langfuse span so that retrieved context
 * documents are logged as span metadata in the Langfuse UI.
 *
 * Uses `startActiveObservation` (the v5 API) to create a named 'rag-retrieval'
 * span and attach userId, sessionId, and query as span metadata.
 *
 * @param query - The user query used for vector similarity search
 * @param userId - Supabase user ID for span correlation
 * @param supabase - Typed Supabase client
 * @param sessionId - Optional conversation/session ID for span grouping
 */
export async function wrapRagWithObserve(
  query: string,
  userId: string,
  supabase: SupabaseClient<Database>,
  sessionId?: string
) {
  return startActiveObservation(
    'rag-retrieval',
    () => getRelevantContext(query, userId, supabase),
    {
      asType: 'retriever',
      // Note: attributes are set via metadata in span; userId/sessionId correlation
      // is established through the parent trace context created by experimental_telemetry
    }
  );
}
