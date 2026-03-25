import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { LangfuseSpanProcessor } from '@langfuse/otel';

// Export the processor so tracing.ts and route handlers can reference it
export const langfuseProcessor = new LangfuseSpanProcessor({
  immediateExport: true, // CRITICAL: Next.js 14 lacks after() — spans must flush immediately
  shouldExport: (span) => !span.name.startsWith('next.'), // Suppress internal Next.js infra spans
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
