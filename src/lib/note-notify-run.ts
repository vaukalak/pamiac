import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents, noteNotifications, user } from "@/db/schema";
import {
  captureNotificationCheckConfirmed,
  captureNotificationCheckTriggered,
  captureServerEvent,
  NOTE_NOTIFICATION_STEPS,
  noteNotificationEvent,
  noteNotificationSavedEvent,
} from "@/lib/analytics";
import { appBaseUrl } from "@/lib/config";
import { HttpError } from "@/lib/http";
import { sendNoteUpdated } from "@/lib/mail";
import {
  criteriaEmailDecision,
  criteriaMatchResult,
  jevAuthedRequest,
  jevCriteriaTestBody,
  jevDecideBody,
  jevRepeatBody,
  planNoteBurst,
  readCriteriaVerdict,
  readRepeatsEveryChange,
  type NoteBurstDelivery,
  type NoteNotifyMode,
} from "@/lib/note-notify";

const timers = new Map<string, ReturnType<typeof setTimeout>>();

const NOTE_NOTIFY_ERROR_STEPS = new Set([
  "jev_http",
  "jev_network",
  "jev_unreadable",
  "timer_failed",
]);

interface NoteNotifyTrace {
  documentId: string;
  step: string;
  userId?: string;
  mode?: NoteNotifyMode;
  source?: "test" | "delivery";
  result?: string | boolean;
  delayMs?: number;
}

function noteNotifyConsoleValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.includes("@") || trimmed.length > 80) return "";
  return trimmed;
}

function noteNotifyConsoleResult(result: string) {
  const trimmed = noteNotifyConsoleValue(result);
  if (
    trimmed === "cleared" ||
    trimmed === "idle" ||
    trimmed === "empty" ||
    trimmed === "mismatch" ||
    trimmed === "same_text" ||
    /^\d{3}$/.test(trimmed)
  ) {
    return trimmed;
  }
  return "";
}

async function noteNotifyTrace(input: NoteNotifyTrace) {
  try {
    const documentId = noteNotifyConsoleValue(input.documentId);
    const step = NOTE_NOTIFICATION_STEPS.has(input.step) ? input.step : "";
    const line: Record<string, string | boolean | number> = {};
    if (documentId) line.documentId = documentId;
    if (step) line.step = step;
    if (input.mode) line.mode = input.mode;
    if (input.source) line.source = input.source;
    if (typeof input.result === "boolean") line.result = input.result;
    if (typeof input.result === "string") {
      const result = noteNotifyConsoleResult(input.result);
      if (result) line.result = result;
    }
    if (typeof input.delayMs === "number" && Number.isFinite(input.delayMs)) {
      line.delayMs = input.delayMs;
    }
    const text = `note-notify ${JSON.stringify(line)}`;
    if (NOTE_NOTIFY_ERROR_STEPS.has(input.step)) console.error(text);
    else console.info(text);
    await captureServerEvent(
      noteNotificationEvent({
        userId: input.userId ?? "",
        documentId: input.documentId,
        step: input.step,
        mode: input.mode,
        source: input.source,
        result: input.result,
      }),
    );
  } catch {
    // Logging must not change whether the email sends.
  }
}

function noteNotifyReturn(input: NoteNotifyTrace) {
  return noteNotifyTrace(input);
}

function clearNoteTimer(documentId: string) {
  const handle = timers.get(documentId);
  if (!handle) return;
  clearTimeout(handle);
  timers.delete(documentId);
}

function armNoteTimer(documentId: string, dueAt: number, now: number, userId: string) {
  clearNoteTimer(documentId);
  const delay = Math.max(0, dueAt - now);
  const handle = setTimeout(() => {
    timers.delete(documentId);
    void deliverArmedNote(documentId, dueAt, userId).catch((error) => {
      console.error(error);
      void noteNotifyTrace({ documentId, userId, step: "timer_failed" });
    });
  }, delay);
  if (typeof handle.unref === "function") handle.unref();
  timers.set(documentId, handle);
}

async function ownedNote(ownerId: string, id: string) {
  const [document] = await getDb()
    .select()
    .from(documents)
    .where(and(eq(documents.id, id), eq(documents.ownerId, ownerId)));
  if (!document || document.type !== "note") throw new HttpError(404, "Document not found");
  return document;
}

export async function readNoteNotification(ownerId: string, id: string) {
  await ownedNote(ownerId, id);
  const [row] = await getDb()
    .select({ mode: noteNotifications.mode, criteria: noteNotifications.criteria })
    .from(noteNotifications)
    .where(eq(noteNotifications.documentId, id));
  return {
    mode: row?.mode ?? "never",
    criteria: row?.criteria ?? "",
  };
}

export async function saveNoteNotification(
  ownerId: string,
  id: string,
  input: { mode: NoteNotifyMode; criteria: string },
) {
  await ownedNote(ownerId, id);
  const criteria = input.mode === "criteria" ? input.criteria.trim() : "";
  await getDb()
    .insert(noteNotifications)
    .values({ documentId: id, mode: input.mode, criteria, criteriaMatched: false })
    .onConflictDoUpdate({
      target: noteNotifications.documentId,
      set: { mode: input.mode, criteria, criteriaMatched: false },
    });
  await captureServerEvent(
    noteNotificationSavedEvent({
      userId: ownerId,
      documentId: id,
      mode: input.mode,
    }),
  );
  return { mode: input.mode, criteria };
}

async function postDecide(
  body: unknown,
  context: { documentId: string; userId: string; source: "test" | "delivery" },
) {
  const apiKey = process.env.JEV_API_KEY?.trim();
  if (!apiKey) {
    await noteNotifyTrace({ ...context, step: "jev_missing_key" });
    return null;
  }
  const request = jevAuthedRequest(apiKey, body);
  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body),
    });
    if (!response.ok) {
      await noteNotifyTrace({ ...context, step: "jev_http", result: String(response.status) });
      return null;
    }
    try {
      return (await response.json()) as unknown;
    } catch {
      await noteNotifyTrace({ ...context, step: "jev_unreadable" });
      return null;
    }
  } catch {
    await noteNotifyTrace({ ...context, step: "jev_network" });
    return null;
  }
}

async function deliverOwnerEmail(input: { documentId: string; ownerId: string; title: string }) {
  const [owner] = await getDb()
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, input.ownerId));
  if (!owner?.email) {
    return noteNotifyReturn({
      documentId: input.documentId,
      userId: input.ownerId,
      step: "no_owner_email",
      source: "delivery",
    });
  }
  await sendNoteUpdated({
    email: owner.email,
    noteTitle: input.title,
    url: `${appBaseUrl()}/d/${input.documentId}`,
  });
  await noteNotifyTrace({
    documentId: input.documentId,
    userId: input.ownerId,
    step: "email_returned",
    source: "delivery",
  });
}

async function sendCriteriaUpdate(input: {
  criteria: string;
  documentId: string;
  oldText: string;
  newText: string;
  ownerId: string;
  previouslyMatched: boolean;
  title: string;
}) {
  await captureNotificationCheckTriggered({
    documentId: input.documentId,
    source: "delivery",
    userId: input.ownerId,
  });
  const judged = await postDecide(
    jevDecideBody({
      criteria: input.criteria,
      newText: input.newText,
      oldText: input.oldText,
    }),
    { documentId: input.documentId, userId: input.ownerId, source: "delivery" },
  );
  if (!judged) {
    return noteNotifyReturn({
      documentId: input.documentId,
      userId: input.ownerId,
      step: "judge_unavailable",
      mode: "criteria",
      source: "delivery",
    });
  }
  const matched = criteriaMatchResult(judged);
  if (matched === null) {
    return noteNotifyReturn({
      documentId: input.documentId,
      userId: input.ownerId,
      step: "match_unreadable",
      mode: "criteria",
      source: "delivery",
    });
  }
  await captureNotificationCheckConfirmed({
    documentId: input.documentId,
    source: "delivery",
    userId: input.ownerId,
    result: matched,
  });
  const cadence = matched
    ? await postDecide(jevRepeatBody(input.criteria), {
        documentId: input.documentId,
        userId: input.ownerId,
        source: "delivery",
      })
    : null;
  const repeats = cadence ? readRepeatsEveryChange(cadence) : false;
  const decision = criteriaEmailDecision({
    matched,
    previouslyMatched: input.previouslyMatched,
    repeats,
  });
  await getDb()
    .update(noteNotifications)
    .set({ criteriaMatched: decision.matched })
    .where(eq(noteNotifications.documentId, input.documentId));
  if (!decision.email) {
    return noteNotifyReturn({
      documentId: input.documentId,
      userId: input.ownerId,
      step: decision.matched ? "matched_suppressed" : "not_matched",
      mode: "criteria",
      source: "delivery",
      result: decision.matched,
    });
  }
  await noteNotifyTrace({
    documentId: input.documentId,
    userId: input.ownerId,
    step: "matched_email",
    mode: "criteria",
    source: "delivery",
    result: true,
  });
  await deliverOwnerEmail(input);
}

async function sendNoteUpdateEmail(input: {
  documentId: string;
  oldText: string;
  newText: string;
}) {
  if (input.oldText === input.newText) {
    return noteNotifyReturn({ documentId: input.documentId, step: "skipped_same_text" });
  }
  const db = getDb();
  const [document] = await db
    .select({
      type: documents.type,
      title: documents.title,
      ownerId: documents.ownerId,
    })
    .from(documents)
    .where(eq(documents.id, input.documentId));
  if (!document || document.type !== "note") {
    return noteNotifyReturn({
      documentId: input.documentId,
      userId: document?.ownerId,
      step: "missing_note",
    });
  }
  const [subscription] = await db
    .select({
      criteria: noteNotifications.criteria,
      criteriaMatched: noteNotifications.criteriaMatched,
      mode: noteNotifications.mode,
    })
    .from(noteNotifications)
    .where(eq(noteNotifications.documentId, input.documentId));
  const mode = subscription?.mode ?? "never";
  if (mode === "never") {
    return noteNotifyReturn({
      documentId: input.documentId,
      userId: document.ownerId,
      step: "mode_never",
      mode: "never",
    });
  }
  if (mode === "criteria") {
    await noteNotifyTrace({
      documentId: input.documentId,
      userId: document.ownerId,
      step: "mode_criteria",
      mode: "criteria",
    });
    await sendCriteriaUpdate({
      criteria: subscription?.criteria ?? "",
      documentId: input.documentId,
      newText: input.newText,
      oldText: input.oldText,
      ownerId: document.ownerId,
      previouslyMatched: subscription?.criteriaMatched ?? false,
      title: document.title,
    });
    return;
  }
  await noteNotifyTrace({
    documentId: input.documentId,
    userId: document.ownerId,
    step: "mode_any",
    mode: "any",
  });
  await deliverOwnerEmail({
    documentId: input.documentId,
    ownerId: document.ownerId,
    title: document.title,
  });
}

export async function testNoteCriteria(ownerId: string, id: string, criteria: string) {
  const document = await ownedNote(ownerId, id);
  await captureNotificationCheckTriggered({
    documentId: id,
    source: "test",
    userId: ownerId,
  });
  const payload = await postDecide(jevCriteriaTestBody({ criteria, note: document.content }), {
    documentId: id,
    userId: ownerId,
    source: "test",
  });
  const verdict = payload ? readCriteriaVerdict(payload) : null;
  if (!verdict) {
    await noteNotifyTrace({
      documentId: id,
      userId: ownerId,
      step: "test_no_verdict",
      mode: "criteria",
      source: "test",
    });
    throw new HttpError(502, "Could not test this condition");
  }
  await captureNotificationCheckConfirmed({
    documentId: id,
    source: "test",
    userId: ownerId,
    result: verdict,
  });
  return { result: verdict };
}

async function deliverArmedNote(documentId: string, expectedDueAt: number, userId: string) {
  await noteNotifyTrace({ documentId, userId, step: "timer_fired" });
  const claimed = await getDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(noteNotifications)
      .where(eq(noteNotifications.documentId, documentId))
      .for("update");
    if (!row?.dueAt || row.dueAt.getTime() !== expectedDueAt) {
      const reason = row?.dueAt ? "mismatch" : "empty";
      return { reason } as const;
    }
    const baseline = row.baselineContent ?? "";
    const latest = row.latestContent ?? "";
    await tx
      .update(noteNotifications)
      .set({ baselineContent: null, latestContent: null, dueAt: null })
      .where(eq(noteNotifications.documentId, documentId));
    if (baseline === latest) return { reason: "same_text" } as const;
    return { reason: "ready" as const, oldText: baseline, newText: latest };
  });
  if (claimed.reason !== "ready") {
    await noteNotifyTrace({
      documentId,
      userId,
      step: "claim_missed",
      result: claimed.reason,
    });
    return;
  }
  await noteNotifyTrace({ documentId, userId, step: "claimed" });
  await sendNoteUpdateEmail({ documentId, oldText: claimed.oldText, newText: claimed.newText });
}

export async function onNoteContentChanged(input: {
  documentId: string;
  previousContent: string;
  nextContent: string;
  now?: number;
}) {
  if (input.previousContent === input.nextContent) return;
  const now = input.now ?? Date.now();
  const step = await getDb().transaction(async (tx) => {
    const [document] = await tx
      .select({ ownerId: documents.ownerId })
      .from(documents)
      .where(eq(documents.id, input.documentId));
    const ownerId = document?.ownerId ?? "";
    const [subscription] = await tx
      .select()
      .from(noteNotifications)
      .where(eq(noteNotifications.documentId, input.documentId))
      .for("update");
    const mode = subscription?.mode ?? "never";
    if (mode === "never") {
      const cleared = Boolean(
        subscription?.dueAt || subscription?.baselineContent || subscription?.latestContent,
      );
      if (cleared) {
        await tx
          .update(noteNotifications)
          .set({ baselineContent: null, latestContent: null, dueAt: null })
          .where(eq(noteNotifications.documentId, input.documentId));
      }
      return {
        deliver: null as NoteBurstDelivery | null,
        dueAt: null as number | null,
        ownerId,
        mode,
        cleared,
      };
    }
    const pending =
      subscription?.dueAt &&
      subscription.baselineContent !== null &&
      subscription.latestContent !== null
        ? {
            baseline: subscription.baselineContent ?? "",
            latest: subscription.latestContent ?? "",
            dueAt: subscription.dueAt.getTime(),
          }
        : null;
    const plan = planNoteBurst({
      pending,
      previousContent: input.previousContent,
      nextContent: input.nextContent,
      now,
    });
    await tx
      .update(noteNotifications)
      .set({
        baselineContent: plan.pending.baseline,
        latestContent: plan.pending.latest,
        dueAt: new Date(plan.pending.dueAt),
      })
      .where(eq(noteNotifications.documentId, input.documentId));
    return {
      deliver: plan.deliver,
      dueAt: plan.pending.dueAt,
      ownerId,
      mode,
      cleared: false,
    };
  });
  if (step.mode === "never") {
    await noteNotifyTrace({
      documentId: input.documentId,
      userId: step.ownerId,
      step: "mode_never_cleared",
      mode: "never",
      result: step.cleared ? "cleared" : "idle",
    });
  }
  if (step.deliver) {
    await noteNotifyTrace({
      documentId: input.documentId,
      userId: step.ownerId,
      step: "immediate_delivery",
      mode: step.mode,
    });
    await sendNoteUpdateEmail({
      documentId: input.documentId,
      oldText: step.deliver.oldText,
      newText: step.deliver.newText,
    });
  }
  if (step.dueAt === null) {
    clearNoteTimer(input.documentId);
    return;
  }
  armNoteTimer(input.documentId, step.dueAt, now, step.ownerId);
  await noteNotifyTrace({
    documentId: input.documentId,
    userId: step.ownerId,
    step: "burst_armed",
    mode: step.mode,
    delayMs: Math.max(0, step.dueAt - now),
  });
}
