import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GhostTrace — Personal AI Provenance & Memory Recovery',
  description: 'Find the bad memory. Trace its influence. Prove the recovery.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

