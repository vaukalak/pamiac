export const POSTHOG_DEFAULT_HOST = "https://us.i.posthog.com";

export function posthogKey(env: NodeJS.ProcessEnv = process.env) {
  return env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ?? "";
}

export function posthogHost(env: NodeJS.ProcessEnv = process.env) {
  return env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || POSTHOG_DEFAULT_HOST;
}

export function posthogBrowserOptions(host: string) {
  return {
    api_host: host,
    defaults: "2026-05-30" as const,
    capture_pageview: false as const,
    capture_pageleave: false as const,
    autocapture: false,
    disable_session_recording: true,
  };
}

export function pageViewUrl(origin: string, pathname: string, search: string) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  for (const [key, value] of [...params.entries()]) {
    if (value.includes("@") || /email/i.test(key)) params.delete(key);
  }
  const query = params.toString();
  return query ? `${origin}${pathname}?${query}` : `${origin}${pathname}`;
}
