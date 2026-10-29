import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from './components/layout/TopNav';

export const metadata: Metadata = {
  title: 'GhostTrace — Find the bad memory. Trace its influence. Prove the recovery.',
  description: 'Forensic memory tracking, behavioral dependency replay, and cascading revocation for AI agents.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600..700&family=IBM+Plex+Mono:wght@400&family=IBM+Plex+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full flex flex-col antialiased m-0 p-0 overflow-x-hidden">
        <TopNav />
        <main className="flex-1 flex flex-col min-h-0">{children}</main>
      </body>
    </html>
  );
}
