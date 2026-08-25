import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { HeaderNav } from '@/components/ui/HeaderNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BuzzFeed Travel',
  description: 'Discover the world through the eyes of real travelers',
  openGraph: {
    title: 'BuzzFeed Travel',
    description: 'Discover the world through the eyes of real travelers',
    type: 'website',
  },
  manifest: '/manifest.json',
};

// themeColor moved to viewport export per Next.js 15+ requirement
export const viewport: Viewport = {
  themeColor: '#f97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark:bg-gray-900">
      <body className={`${inter.className} dark:text-gray-100`}>
        <Providers>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <HeaderNav />
            <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
