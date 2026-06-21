'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const isChunkError = /ChunkLoadError|Loading chunk|Loading CSS chunk|failed to fetch dynamically imported module/i.test(
    error?.message || '',
  );

  useEffect(() => {
    // A chunk-load error means the browser is holding a stale build reference
    // (common after a deploy or dev rebuild). Force ONE full reload to fetch the
    // fresh chunks — guarded by sessionStorage so we never loop.
    if (isChunkError && typeof window !== 'undefined') {
      const KEY = 'medibot_chunk_reload';
      if (!sessionStorage.getItem(KEY)) {
        sessionStorage.setItem(KEY, '1');
        window.location.reload();
      }
    } else if (typeof window !== 'undefined') {
      sessionStorage.removeItem('medibot_chunk_reload');
    }
  }, [isChunkError]);

  // While the auto-reload is in flight, show a calm light loader instead of the
  // alarming red error screen.
  if (isChunkError) {
    return (
      <html lang="en">
        <body style={{ margin: 0, backgroundColor: '#F8FAFC' }}>
          <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-teal-600 animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Updating Medibot to the latest version…</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body style={{ margin: 0, backgroundColor: '#F8FAFC' }}>
        <div className="min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E6FAF8] flex items-center justify-center px-4">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <AlertTriangle className="h-10 w-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Something went wrong</h1>
            <p className="text-lg text-gray-600 mb-2">Medibot ran into an unexpected error.</p>
            <p className="text-base text-gray-500 mb-8">Don't worry — this has been logged and we'll look into it.</p>

            {process.env.NODE_ENV === 'development' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-red-800 mb-2">Error Details:</h3>
                <code className="text-sm text-red-600 break-all">{error.message}</code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={reset}
                className="group bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 min-w-[180px]"
              >
                <RefreshCw className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Try Again
              </button>

              <Link href="/">
                <button className="group bg-white hover:bg-gray-50 text-gray-700 px-8 py-3 rounded-xl font-semibold shadow-lg border border-gray-300 transition-all duration-300 hover:scale-105 flex items-center gap-2 min-w-[180px]">
                  <Home className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Back to Home
                </button>
              </Link>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                If this problem persists, please
                <Link href="/help" className="text-teal-600 hover:text-teal-700 font-medium ml-1">
                  report it to us
                </Link>
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
