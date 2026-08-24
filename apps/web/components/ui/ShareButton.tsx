'use client';

import { useState } from 'react';

interface ShareButtonProps {
  url: string;
  title: string;
}

export function ShareButton({ url, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // Use native Web Share API if available (mobile browsers, PWA)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled — not an error
        return;
      }
    }
    // Clipboard fallback for desktop
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g., non-secure context)
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors active:scale-90"
        aria-label="Share post"
      >
        <span className="text-base">↗</span>
        <span className="text-xs font-medium">Share</span>
      </button>
      {copied && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          Link copied!
        </div>
      )}
    </div>
  );
}
