"use client";

import posthog from "posthog-js";
import {
  posthogIdentifyCall,
  posthogProjectTokenFrom,
  posthogSdkCallable,
  type PostHogPerson,
} from "./posthog-identity";

function projectToken() {
  return posthogProjectTokenFrom(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);
}

function sdkReady() {
  try {
    return posthogSdkCallable({ token: projectToken(), loaded: posthog.__loaded });
  } catch {
    return false;
  }
}

export function identifySignedInUser(person: PostHogPerson | null | undefined) {
  const call = posthogIdentifyCall(person);
  if (!call || !sdkReady()) return;
  try {
    posthog.identify(call.distinctId, call.properties);
  } catch {
    return;
  }
}

export function resetPostHog() {
  if (!sdkReady()) return;
  try {
    posthog.reset();
  } catch {
    return;
  }
}
