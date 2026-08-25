'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth-context';

/**
 * Sticky site header.
 *
 * Renders three states:
 *  - Not hydrated: blank right side (prevents flash of wrong content)
 *  - Hydrated + unauthenticated: "Sign in" + "Sign up" links
 *  - Hydrated + authenticated: avatar, username, bookmarks, logout
 */
export function HeaderNav() {
  const { user, isAuthenticated, isHydrated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/"
          className="text-xl font-bold text-orange-500 tracking-tight hover:text-orange-600 transition-colors"
        >
          ✈ BuzzFeed Travel
        </Link>

        {/* Right side — suppressed until hydration resolves to avoid flash */}
        {isHydrated && (
          <nav className="flex items-center gap-3" aria-label="Site navigation">
            {isAuthenticated && user ? (
              <>
                <Link
                  href="/bookmarks"
                  className="text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors text-sm font-medium"
                >
                  Bookmarks
                </Link>

                {/* User avatar + name */}
                <div className="flex items-center gap-2">
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={28}
                    height={28}
                    className="rounded-full object-cover ring-2 ring-orange-200"
                  />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden sm:block">
                    {user.name.split(' ')[0]}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Sign out"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
