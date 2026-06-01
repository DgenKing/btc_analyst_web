'use client';

import { useEffect } from 'react';

/**
 * Browser extensions (wallets, price trackers, etc.) inject scripts into the page's
 * main world. When one of them throws — e.g. "Chrome Version: Cannot read properties
 * of null" from chrome-extension://.../injected.js — Next.js's dev error overlay
 * can't tell it apart from our own code and shows a full-screen panel.
 *
 * This guard swallows *only* errors whose origin is a browser extension. Real app
 * errors (no extension frames in the stack) pass through untouched, so the overlay
 * still works for genuine bugs. No-op effect in production (no overlay exists there).
 */
const EXTENSION_MARKERS = [
  'chrome-extension://',
  'moz-extension://',
  'safari-extension://',
  'safari-web-extension://',
];

function looksLikeExtension(text: string): boolean {
  return EXTENSION_MARKERS.some((m) => text.includes(m));
}

export default function ExtensionErrorSuppressor() {
  useEffect(() => {
    // 1) console.error — our wrapper sits OUTSIDE Next's dev-overlay patch, so a
    //    swallowed call never reaches the overlay.
    const originalConsoleError = console.error;
    console.error = function (...args: unknown[]) {
      try {
        const stack = new Error().stack ?? '';
        const argText = args
          .map((a) => (a instanceof Error ? `${a.message} ${a.stack ?? ''}` : typeof a === 'string' ? a : ''))
          .join(' ');
        if (looksLikeExtension(stack) || looksLikeExtension(argText)) {
          return; // extension noise — drop it
        }
      } catch {
        // detection failed — fall through and log normally
      }
      return originalConsoleError.apply(console, args as []);
    };

    // 2) Uncaught errors / promise rejections thrown from extension scripts.
    const onError = (e: ErrorEvent) => {
      const src = `${e.filename ?? ''} ${e.error?.stack ?? ''} ${e.message ?? ''}`;
      if (looksLikeExtension(src)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const src =
        reason instanceof Error ? `${reason.message} ${reason.stack ?? ''}` : String(reason ?? '');
      if (looksLikeExtension(src)) {
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };

    window.addEventListener('error', onError, true);
    window.addEventListener('unhandledrejection', onRejection, true);

    return () => {
      console.error = originalConsoleError;
      window.removeEventListener('error', onError, true);
      window.removeEventListener('unhandledrejection', onRejection, true);
    };
  }, []);

  return null;
}
