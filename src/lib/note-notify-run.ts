import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { documents, noteNotifications, user } from "@/db/schema";
import {
  captureNotificationCheckConfirmed,
  captureNotificationCheckTriggered,
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

function clearNoteTimer(documentId: string) {
  const handle = timers.get(documentId);
  if (!handle) return;
  clearTimeout(handle);
  timers.delete(documentId);
}

function armNoteTimer(documentId: string, dueAt: number, now: number) {
  clearNoteTimer(documentId);
  const delay = Math.max(0, dueAt - now);
  const handle = setTimeout(() => {
    timers.delete(documentId);
    void deliverArmedNote(documentId, dueAt).catch((error) => {
      console.error(error);
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
  return { mode: input.mode, criteria };
}

async function postDecide(body: unknown) {
  const apiKey = process.env.JEV_API_KEY?.trim();
  if (!apiKey) return null;
  const request = jevAuthedRequest(apiKey, body);
  try {
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.body),
    });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

async function deliverOwnerEmail(input: { documentId: string; ownerId: string; title: string }) {
  const [owner] = await getDb()
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, input.ownerId));
  if (!owner?.email) return;
  await sendNoteUpdated({
    email: owner.email,
    noteTitle: input.title,
    url: `${appBaseUrl()}/d/${input.documentId}`,
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
  );
  if (!judged) return;
  const matched = criteriaMatchResult(judged);
  if (matched === null) return;
  await captureNotificationCheckConfirmed({
    documentId: input.documentId,
    source: "delivery",
    userId: input.ownerId,
    result: matched,
  });
  const cadence = matched ? await postDecide(jevRepeatBody(input.criteria)) : null;
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
  if (!decision.email) return;
  await deliverOwnerEmail(input);
}

async function sendNoteUpdateEmail(input: {
  documentId: string;
  oldText: string;
  newText: string;
}) {
  if (input.oldText === input.newText) return;
  const db = getDb();
  const [document] = await db
    .select({
      type: documents.type,
      title: documents.title,
      ownerId: documents.ownerId,
    })
    .from(documents)
    .where(eq(documents.id, input.documentId));
  if (!document || document.type !== "note") return;
  const [subscription] = await db
    .select({
      criteria: noteNotifications.criteria,
      criteriaMatched: noteNotifications.criteriaMatched,
      mode: noteNotifications.mode,
    })
    .from(noteNotifications)
    .where(eq(noteNotifications.documentId, input.documentId));
  const mode = subscription?.mode ?? "never";
  if (mode === "never") return;
  if (mode === "criteria") {
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
  const payload = await postDecide(jevCriteriaTestBody({ criteria, note: document.content }));
  const verdict = payload ? readCriteriaVerdict(payload) : null;
  if (!verdict) throw new HttpError(502, "Could not test this condition");
  await captureNotificationCheckConfirmed({
    documentId: id,
    source: "test",
    userId: ownerId,
    result: verdict,
  });
  return { result: verdict };
}

async function deliverArmedNote(documentId: string, expectedDueAt: number) {
  const claimed = await getDb().transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(noteNotifications)
      .where(eq(noteNotifications.documentId, documentId))
      .for("update");
    if (!row?.dueAt || row.dueAt.getTime() !== expectedDueAt) return null;
    const baseline = row.baselineContent ?? "";
    const latest = row.latestContent ?? "";
    await tx
      .update(noteNotifications)
      .set({ baselineContent: null, latestContent: null, dueAt: null })
      .where(eq(noteNotifications.documentId, documentId));
    if (baseline === latest) return null;
    return { oldText: baseline, newText: latest };
  });
  if (!claimed) return;
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
    const [subscription] = await tx
      .select()
      .from(noteNotifications)
      .where(eq(noteNotifications.documentId, input.documentId))
      .for("update");
    const mode = subscription?.mode ?? "never";
    if (mode === "never") {
      if (subscription?.dueAt || subscription?.baselineContent || subscription?.latestContent) {
        await tx
          .update(noteNotifications)
          .set({ baselineContent: null, latestContent: null, dueAt: null })
          .where(eq(noteNotifications.documentId, input.documentId));
      }
      return { deliver: null as NoteBurstDelivery | null, dueAt: null as number | null };
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
    return { deliver: plan.deliver, dueAt: plan.pending.dueAt };
  });
  if (step.deliver) {
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
  armNoteTimer(input.documentId, step.dueAt, now);
}
