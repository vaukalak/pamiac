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
        message: "Describe the condition",
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

export function jevAuthedRequest<Body>(apiKey: string, body: Body) {
  return {
    url: JEV_DECIDE_URL,
    method: "POST" as const,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body,
  };
}

export function jevDecideRequest(input: {
  oldText: string;
  newText: string;
  criteria: string;
  apiKey: string;
}) {
  return jevAuthedRequest(input.apiKey, jevDecideBody(input));
}

export function jevCriteriaTestBody(input: { note: string; criteria: string }) {
  return {
    state: {
      condition: input.criteria,
      note: input.note,
    },
    questions: {
      current: {
        type: "choice" as const,
        instructions:
          "Which outcome describes the note's current text against the condition? The condition is a watch rule.",
        criteria: {
          future: "The note needs a future change before it matches the condition.",
          matches: "The note already matches the condition.",
          misses: "The note does not match the condition.",
        },
      },
    },
  };
}

export function jevRepeatBody(criteria: string) {
  return {
    state: {
      condition: criteria,
    },
    questions: {
      cadence: {
        type: "choice" as const,
        instructions:
          "Does this condition explicitly ask to be told on every matching change, including repeated events while it stays true?",
        criteria: {
          edge: "It asks to be told when the condition becomes true, without asking for every later matching change.",
          every:
            "It explicitly asks for a notification on every matching change or repeated event.",
        },
      },
    },
  };
}

const criteriaTestSchema = z
  .object({
    criteria: z.string(),
  })
  .superRefine((value, context) => {
    const text = value.criteria.trim();
    if (!text) {
      context.addIssue({
        code: "custom",
        path: ["criteria"],
        message: "Describe the condition",
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

export function parseCriteriaTest(input: unknown) {
  const parsed = criteriaTestSchema.parse(input);
  return { criteria: parsed.criteria.trim() };
}

export const CRITERIA_VERDICTS = ["matches", "misses", "future"] as const;
export type CriteriaVerdict = (typeof CRITERIA_VERDICTS)[number];

export const CRITERIA_VERDICT_COPY: Record<CriteriaVerdict, string> = {
  future: "Needs a future change to match",
  matches: "Matches this note",
  misses: "Doesn't match this note",
};

function readChoiceAnswer(payload: unknown, question: string) {
  if (!payload || typeof payload !== "object") return null;
  const answers = (payload as { answers?: unknown }).answers;
  if (!answers || typeof answers !== "object") return null;
  const item = (answers as Record<string, unknown>)[question];
  if (!item || typeof item !== "object") return null;
  const choice = (item as { choice?: unknown }).choice;
  return typeof choice === "string" ? choice : null;
}

export function readCriteriaVerdict(payload: unknown): CriteriaVerdict | null {
  const choice = readChoiceAnswer(payload, "current");
  if (choice === "matches" || choice === "misses" || choice === "future") return choice;
  return null;
}

export function readRepeatsEveryChange(payload: unknown) {
  return readChoiceAnswer(payload, "cadence") === "every";
}

export function criteriaEmailDecision(input: {
  matched: boolean;
  previouslyMatched: boolean;
  repeats: boolean;
}) {
  if (!input.matched) return { email: false, matched: false };
  if (input.repeats || !input.previouslyMatched) return { email: true, matched: true };
  return { email: false, matched: true };
}

export function criteriaMatchResult(payload: unknown): boolean | null {
  if (!payload || typeof payload !== "object") return null;
  const answers = (payload as { answers?: unknown }).answers;
  if (!answers || typeof answers !== "object") return null;
  const question = (answers as { matches_criteria?: unknown }).matches_criteria;
  if (!question || typeof question !== "object") return null;
  const noul = (question as { noul?: unknown }).noul;
  if (typeof noul !== "number" || Number.isNaN(noul)) return null;
  return noul >= 0.5;
}

export function criteriaMatches(payload: unknown) {
  return criteriaMatchResult(payload) === true;
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
