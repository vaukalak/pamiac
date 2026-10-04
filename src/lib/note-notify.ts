import { z } from "zod";

export const NOTE_NOTIFY_QUIET_MS = 3 * 60 * 1000;
export const JEV_DECIDE_URL = "https://jevtypesafeai.com/api/v1/decide";
export const NOTE_CRITERIA_MAX = 2000;

const MODES = ["never", "any", "criteria"] as const;
export type NoteNotifyMode = (typeof MODES)[number];

export interface NoteBurst {
  baseline: string;
  latest: string;
  dueAt: number;
}

export interface NoteBurstDelivery {
  oldText: string;
  newText: string;
}

const noteNotificationSchema = z
  .object({
    mode: z.enum(MODES),
    criteria: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.mode !== "criteria") return;
    const text = value.criteria?.trim() ?? "";
    if (!text) {
      context.addIssue({
        code: "custom",
        path: ["criteria"],
        message: "Describe when to send the notification",
      });
    }
    if (text.length > NOTE_CRITERIA_MAX) {
      context.addIssue({
        code: "custom",
        path: ["criteria"],
        message: "Criteria is too long",
      });
    }
  });

export function parseNoteNotification(input: unknown) {
  const parsed = noteNotificationSchema.parse(input);
  return {
    mode: parsed.mode,
    criteria: parsed.mode === "criteria" ? (parsed.criteria ?? "").trim() : "",
  };
}

export function jevDecideBody(input: { oldText: string; newText: string; criteria: string }) {
  return {
    state: {
      new_text: input.newText,
      old_text: input.oldText,
    },
    questions: {
      matches_criteria: {
        type: "noul" as const,
        instructions: "Does the change from `old_text` to `new_text` matches criteria",
        criteria: {
          true: input.criteria,
        },
      },
    },
  };
}

export function jevDecideRequest(input: {
  oldText: string;
  newText: string;
  criteria: string;
  apiKey: string;
}) {
  return {
    url: JEV_DECIDE_URL,
    method: "POST" as const,
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    body: jevDecideBody(input),
  };
}

export function criteriaMatches(payload: unknown) {
  if (!payload || typeof payload !== "object") return false;
  const answers = (payload as { answers?: unknown }).answers;
  if (!answers || typeof answers !== "object") return false;
  const question = (answers as { matches_criteria?: unknown }).matches_criteria;
  if (!question || typeof question !== "object") return false;
  const noul = (question as { noul?: unknown }).noul;
  if (typeof noul !== "number" || Number.isNaN(noul)) return false;
  return noul >= 0.5;
}

export function planNoteBurst(input: {
  pending: NoteBurst | null;
  previousContent: string;
  nextContent: string;
  now: number;
  quietMs?: number;
}) {
  const quietMs = input.quietMs ?? NOTE_NOTIFY_QUIET_MS;
  const due = Boolean(input.pending && input.pending.dueAt <= input.now);
  const deliver =
    due && input.pending && input.pending.baseline !== input.pending.latest
      ? { oldText: input.pending.baseline, newText: input.pending.latest }
      : null;
  const baseline = input.pending && !due ? input.pending.baseline : input.previousContent;
  const pending: NoteBurst = {
    baseline,
    latest: input.nextContent,
    dueAt: input.now + quietMs,
  };
  return { deliver, pending };
}

export function shouldEmailNote(mode: NoteNotifyMode, criteriaMatched: boolean) {
  if (mode === "never") return false;
  if (mode === "any") return true;
  return criteriaMatched;
}

export function noteBurstDelivery(pending: NoteBurst): NoteBurstDelivery | null {
  if (pending.baseline === pending.latest) return null;
  return { oldText: pending.baseline, newText: pending.latest };
}
