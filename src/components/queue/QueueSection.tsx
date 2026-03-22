import type { ReactNode } from 'react';

type QueueSectionProps = {
  title: string;
  subtitle: string;
  count: number;
  emptyMessage: string;
  children?: ReactNode;
};

export function QueueSection({
  title,
  subtitle,
  count,
  emptyMessage,
  children,
}: QueueSectionProps) {
  return (
    <section className="border-b border-white/5 pb-8 last:border-b-0 last:pb-0">
      <header className="mb-4">
        <div>
          <h2 className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/25">
            {title}
          </h2>
          <p className="mt-1 text-sm text-white/45">{subtitle}</p>
        </div>
      </header>

      {count > 0 ? (
        <div className="space-y-3">{children}</div>
      ) : (
        <p className="border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-sm leading-relaxed text-white/32">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}
