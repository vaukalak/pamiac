import { PostHog } from "posthog-node";
import { posthogHost, posthogProjectToken } from "./posthog-identity.ts";

export {
  posthogHost,
  posthogHostFrom,
  posthogIdentifyCall,
  posthogLogoutEffect,
  posthogProjectToken,
  posthogProjectTokenFrom,
  posthogSdkCallable,
} from "./posthog-identity.ts";

/** Short-lived server client. Null when the project token is missing. */
export function createPostHogClient() {
  const token = posthogProjectToken();
  if (!token) return null;
  return new PostHog(token, {
    host: posthogHost(),
    flushAt: 1,
    flushInterval: 0,
  });
}
