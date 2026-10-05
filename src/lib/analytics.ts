import { PostHog } from "posthog-node";

export const POSTHOG_DEFAULT_HOST = "https://us.i.posthog.com";

export type NotificationCheckSource = "test" | "delivery";

export interface NotificationCheckInput {
  documentId: string;
  source: NotificationCheckSource;
  userId: string;
}

export interface NotificationCheckConfirmedInput extends NotificationCheckInput {
  result: string | boolean | null;
}

export interface AnalyticsEvent {
  distinctId: string;
  event: "notification_check_triggered" | "notification_check_confirmed";
  properties: {
    documentId: string;
    source: NotificationCheckSource;
    result?: string | boolean;
  };
}

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

function checkEvent(
  input: NotificationCheckInput,
  event: AnalyticsEvent["event"],
): AnalyticsEvent | null {
  const userId = input.userId.trim();
  const documentId = input.documentId.trim();
  if (!userId || !documentId) return null;
  return {
    distinctId: userId,
    event,
    properties: {
      documentId,
      source: input.source,
    },
  };
}

export function notificationCheckTriggeredEvent(input: NotificationCheckInput) {
  return checkEvent(input, "notification_check_triggered");
}

export function notificationCheckConfirmedEvent(input: NotificationCheckConfirmedInput) {
  if (input.result === null) return null;
  if (typeof input.result === "string" && input.result.trim() === "") return null;
  const event = checkEvent(input, "notification_check_confirmed");
  if (!event) return null;
  return {
    ...event,
    properties: {
      ...event.properties,
      result: input.result,
    },
  };
}

export async function captureServerEvent(
  event: AnalyticsEvent | null,
  env: NodeJS.ProcessEnv = process.env,
) {
  if (!event) return;
  const key = posthogKey(env);
  if (!key) return;
  const client = new PostHog(key, {
    host: posthogHost(env),
    flushAt: 1,
    flushInterval: 0,
    fetchRetryCount: 0,
    fetchRetryDelay: 0,
    requestTimeout: 1000,
  });
  try {
    await client.captureImmediate({
      distinctId: event.distinctId,
      event: event.event,
      properties: event.properties,
    });
  } catch {
    // Analytics must not change the notification result.
  } finally {
    await client._shutdown(1000).catch(() => undefined);
  }
}

export async function captureNotificationCheckTriggered(
  input: NotificationCheckInput,
  env?: NodeJS.ProcessEnv,
) {
  await captureServerEvent(notificationCheckTriggeredEvent(input), env);
}

export async function captureNotificationCheckConfirmed(
  input: NotificationCheckConfirmedInput,
  env?: NodeJS.ProcessEnv,
) {
  await captureServerEvent(notificationCheckConfirmedEvent(input), env);
}
