import type { Metadata } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist', // Aliasing to match tailwind config
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
  style: ['normal', 'italic'],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: 'NeuroGraph',
  description: 'Organic Discovery → Deep Knowledge → Rigorous Retention',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${newsreader.variable}`}>
      <body className="bg-neural-dark text-neural-light font-sans antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
