import type { Metadata } from 'next';
import { publicAsset } from '@/lib/site-paths';
import './globals.css';
export const metadata: Metadata = {
  icons: { icon: publicAsset('/icon.svg') },
  title: 'Antonio Rivera — A little logic. A lot of possibility.',
  description: 'The portfolio of Antonio Rivera. An exploration of software, thoughtful systems, and the possibilities in between.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://antonio-rivera-portfolio.antoniorivera155.chatgpt.site'),
};
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
