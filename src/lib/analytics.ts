// No analytics provider was wired up anywhere in this app before this file —
// there were no "existing events" to preserve. This is a minimal, vendor-
// agnostic event sink: it pushes to window.dataLayer (the de facto standard
// GTM/GA4 convention), which is a safe no-op today and "just works" the
// moment a GTM container or gtag.js snippet is added later, with zero code
// changes here. Swap trackEvent's body for a real SDK call if/when one is
// chosen — every call site in Landing.tsx stays the same.

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

// Read once per page load — a campaign's UTM params describe where this
// visit came from, not where inside the page the click happened, so every
// event this session fires shares the same utm_* values.
function readUtm(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = params.get(key);
    if (v) out[key] = v;
  }
  return out;
}

let cachedUtm: Record<string, string> | null = null;

export function trackEvent(name: string, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  if (!cachedUtm) cachedUtm = readUtm();
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event: name, ...cachedUtm, ...props });
}
