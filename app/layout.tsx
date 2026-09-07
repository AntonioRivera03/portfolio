import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: '/icon.svg' },
  title: 'Antonio Rivera — A little logic. A lot of possibility.',
  description: 'The portfolio of Antonio Rivera. An exploration of software, thoughtful systems, and the possibilities in between.',
  metadataBase: new URL('https://antonio-rivera-portfolio.antoniorivera155.chatgpt.site'),
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
