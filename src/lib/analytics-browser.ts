import { posthogKey } from "./analytics-public.ts";

export type BrowserAnalyticsEvent =
  "magic_link_requested" | "password_sign_in" | "google_sign_in_started";

export async function captureBrowserEvent(event: BrowserAnalyticsEvent) {
  if (!posthogKey()) return;
  try {
    const posthog = (await import("posthog-js")).default;
    posthog.capture(event);
  } catch {
    // Analytics must not change the product result.
  }
}
