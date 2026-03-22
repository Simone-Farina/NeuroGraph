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
    <section className="border-b border-white/[0.03] pb-10 mb-10 last:border-b-0 last:pb-0 last:mb-0">
      <header className="mb-6">
        <div>
          <h2 className="text-[12px] font-medium uppercase tracking-widest text-white/30">
            {title}
          </h2>
          <p className="mt-1 text-[14px] text-white/40">{subtitle}</p>
        </div>
      </header>

      {count > 0 ? (
        <div className="space-y-0">{children}</div>
      ) : (
        <p className="text-[14px] text-white/20 italic">
          {emptyMessage}
        </p>
      )}
    </section>
  );
}
