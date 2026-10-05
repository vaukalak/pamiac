import { PostHog } from "posthog-node";
import type { Visibility } from "./access.ts";
import {
  pageViewUrl,
  posthogBrowserOptions,
  posthogHost,
  posthogKey,
  POSTHOG_DEFAULT_HOST,
} from "./analytics-public.ts";
import type { DocumentType } from "./content.ts";
import type { NoteNotifyMode } from "./note-notify.ts";

export { pageViewUrl, posthogBrowserOptions, posthogHost, posthogKey, POSTHOG_DEFAULT_HOST };

export type NotificationCheckSource = "test" | "delivery";

export interface NotificationCheckInput {
  documentId: string;
  source: NotificationCheckSource;
  userId: string;
}

export interface NotificationCheckConfirmedInput extends NotificationCheckInput {
  result: string | boolean | null;
}

export type AnalyticsProperty = string | boolean;

export type AnalyticsEventName =
  | "notification_check_triggered"
  | "notification_check_confirmed"
  | "workspace_created"
  | "workspace_invite_accepted"
  | "api_token_created"
  | "document_created"
  | "document_saved"
  | "share_updated"
  | "folder_created"
  | "note_notification_saved"
  | "image_uploaded"
  | "support_request_sent";

const ALLOWED_PROPERTY_KEYS = new Set([
  "documentId",
  "source",
  "result",
  "documentType",
  "mode",
  "folderId",
]);

export interface AnalyticsEvent {
  distinctId: string;
  event: AnalyticsEventName;
  properties: Record<string, AnalyticsProperty>;
}

export function analyticsProperties(properties: Record<string, AnalyticsProperty>) {
  const safe: Record<string, AnalyticsProperty> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!ALLOWED_PROPERTY_KEYS.has(key)) continue;
    if (typeof value === "boolean") {
      safe[key] = value;
      continue;
    }
    const trimmed = value.trim();
    if (!trimmed || trimmed.includes("@") || trimmed.length > 80) continue;
    safe[key] = trimmed;
  }
  return safe;
}

function distinctUser(userId: string) {
  const distinctId = userId.trim();
  if (!distinctId || distinctId.includes("@")) return "";
  return distinctId;
}

function userEvent(
  userId: string,
  event: AnalyticsEventName,
  properties: Record<string, AnalyticsProperty> = {},
): AnalyticsEvent | null {
  const distinctId = distinctUser(userId);
  if (!distinctId) return null;
  return { distinctId, event, properties };
}

function checkEvent(
  input: NotificationCheckInput,
  event: "notification_check_triggered" | "notification_check_confirmed",
): AnalyticsEvent | null {
  const documentId = input.documentId.trim();
  if (!documentId) return null;
  return userEvent(input.userId, event, {
    documentId,
    source: input.source,
  });
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

export function workspaceCreatedEvent(userId: string) {
  return userEvent(userId, "workspace_created");
}

export function workspaceInviteAcceptedEvent(userId: string) {
  return userEvent(userId, "workspace_invite_accepted");
}

export function apiTokenCreatedEvent(userId: string) {
  return userEvent(userId, "api_token_created");
}

function documentEvent(
  input: { userId: string; documentId: string; documentType: string },
  event: "document_created" | "document_saved",
) {
  const documentId = input.documentId.trim();
  const documentType: DocumentType | null =
    input.documentType === "note" || input.documentType === "diagram" ? input.documentType : null;
  if (!documentId || !documentType) return null;
  return userEvent(input.userId, event, {
    documentId,
    documentType,
  });
}

export function documentCreatedEvent(input: {
  userId: string;
  documentId: string;
  documentType: string;
}) {
  return documentEvent(input, "document_created");
}

export function documentSavedEvent(input: {
  userId: string;
  documentId: string;
  documentType: string;
}) {
  return documentEvent(input, "document_saved");
}

const SHARE_MODES = new Set<Visibility>(["private", "public", "password", "emails"]);

export function shareUpdatedEvent(input: { userId: string; documentId: string; mode: string }) {
  const documentId = input.documentId.trim();
  if (!documentId || !SHARE_MODES.has(input.mode as Visibility)) return null;
  return userEvent(input.userId, "share_updated", {
    documentId,
    mode: input.mode,
  });
}

export function folderCreatedEvent(input: { userId: string; folderId: string }) {
  const folderId = input.folderId.trim();
  if (!folderId) return null;
  return userEvent(input.userId, "folder_created", { folderId });
}

const NOTE_MODES = new Set<NoteNotifyMode>(["never", "any", "criteria"]);

export function noteNotificationSavedEvent(input: {
  userId: string;
  documentId: string;
  mode: string;
}) {
  const documentId = input.documentId.trim();
  if (!documentId || !NOTE_MODES.has(input.mode as NoteNotifyMode)) return null;
  return userEvent(input.userId, "note_notification_saved", {
    documentId,
    mode: input.mode,
  });
}

export function imageUploadedEvent(input: { userId: string; documentId: string | null }) {
  const documentId = input.documentId?.trim() ?? "";
  if (!documentId) return null;
  return userEvent(input.userId, "image_uploaded", { documentId });
}

export function supportRequestSentEvent(userId: string | null) {
  const distinctId = distinctUser(userId ?? "") || "anonymous";
  return {
    distinctId,
    event: "support_request_sent" as const,
    properties: {},
  };
}

export async function captureServerEvent(
  event: AnalyticsEvent | null,
  env: NodeJS.ProcessEnv = process.env,
) {
  try {
    if (!event) return;
    const distinctId = distinctUser(event.distinctId);
    if (!distinctId) return;
    const key = posthogKey(env);
    if (!key) return;
    const properties = analyticsProperties(event.properties);
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
        distinctId,
        event: event.event,
        properties,
      });
    } catch {
      // Analytics must not change the product result.
    } finally {
      await client._shutdown(1000).catch(() => undefined);
    }
  } catch {
    // Analytics must not change the product result.
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
