import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

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
  themeColor: '#f97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark:bg-gray-900">
      <body className={`${inter.className} dark:text-gray-100`}>
        <Providers>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                <a href="/" className="text-xl font-bold text-orange-500">
                  ✈ BuzzFeed Travel
                </a>
                <a
                  href="/bookmarks"
                  className="text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors text-sm font-medium"
                >
                  Bookmarks
                </a>
              </div>
            </header>
            <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
