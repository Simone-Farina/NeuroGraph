import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';

// Export the processor so tracing.ts and route handlers can reference it.
// flushAt: 1 — flush each span immediately (Next.js 14 has no after() API, so
// we cannot defer flushing; spans must be exported before the route response returns).
// shouldExportSpan — suppress internal Next.js infra spans to reduce dashboard noise.
export const langfuseProcessor = new LangfuseSpanProcessor({
  flushAt: 1, // immediateExport equivalent — Next.js 14 lacks after()
  shouldExportSpan: ({ otelSpan }) => !otelSpan.name.startsWith('next.'),
});

export async function register() {
  // Only run on Node.js runtime — skip Edge runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const provider = new NodeTracerProvider({
      spanProcessors: [langfuseProcessor],
    });
    provider.register();
  }
}
