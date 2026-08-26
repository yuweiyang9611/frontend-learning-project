import type { Metadata } from 'next';
import './globals.css';
import './product.css';
import './responsive.css';

export const metadata: Metadata = {
  title: 'IssueFlow — Move work forward',
  description: 'A focused issue tracker for product teams that value clarity and momentum.',
  metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'IssueFlow — Move work forward',
    description: 'A focused issue tracker for product teams that value clarity and momentum.',
    type: 'website',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'IssueFlow — Move work forward' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IssueFlow — Move work forward',
    description: 'A focused issue tracker for product teams that value clarity and momentum.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
