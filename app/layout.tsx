import type { Metadata, Viewport } from 'next';
import { Press_Start_2P } from 'next/font/google';
import './globals.css';

const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'] });

// Resolve the canonical origin for OG/Twitter URLs: an explicit override wins,
// then Vercel's auto-injected deployment URL, then local dev.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Stranded on a Raft — Raft Survival',
  description:
    'A 2D survival game: fish, build, fight sharks and krakens, and survive 20 days adrift on a raft.',
  applicationName: 'Raft Survival',
  keywords: ['raft survival', 'survival game', '2D game', 'browser game', 'pixel game'],
  openGraph: {
    type: 'website',
    siteName: 'Raft Survival',
    title: 'Stranded on a Raft — Raft Survival',
    description: 'Fish, build, fight, and survive 20 days adrift on a raft.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stranded on a Raft — Raft Survival',
    description: 'Fish, build, fight, and survive 20 days adrift on a raft.',
  },
  appleWebApp: {
    capable: true,
    title: 'Raft Survival',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#2D8FBD',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pressStart.className} bg-black text-white overflow-hidden`}>
        {children}
      </body>
    </html>
  );
}
