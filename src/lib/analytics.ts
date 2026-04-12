import type { AnalyticsEventName } from '@/types';

export type EventPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(name: AnalyticsEventName, params?: EventPayload) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, params);
  }
}

export async function recordEvent(name: AnalyticsEventName, sessionId?: string, params?: EventPayload) {
  trackEvent(name, params);
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        sessionId,
        params
      })
    });
  } catch {
    // Analytics should never block the user flow.
  }
}
