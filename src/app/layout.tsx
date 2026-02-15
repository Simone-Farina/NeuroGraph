import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeuroGraph',
  description: 'Organic Discovery → Crystallized Knowledge → Rigorous Retention',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-neural-dark text-neural-light">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
