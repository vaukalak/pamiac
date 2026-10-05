import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ZodError } from "zod";
import {
  CRITERIA_VERDICT_COPY,
  JEV_DECIDE_URL,
  NOTE_NOTIFY_QUIET_MS,
  criteriaEmailDecision,
  criteriaMatches,
  jevAuthedRequest,
  jevCriteriaTestBody,
  jevDecideBody,
  jevDecideRequest,
  jevRepeatBody,
  noteBurstDelivery,
  parseCriteriaTest,
  parseNoteNotification,
  planNoteBurst,
  readCriteriaVerdict,
  readRepeatsEveryChange,
  shouldEmailNote,
  type NoteBurst,
} from "./note-notify.ts";

const INSTRUCTIONS = "Does the change from `old_text` to `new_text` matches criteria";

describe("jev decide request", () => {
  it("sends the previous note as old_text and the update as new_text", () => {
    const body = jevDecideBody({
      oldText: "previous note",
      newText: "updated note",
      criteria: "mention the launch",
    });
    const request = jevDecideRequest({
      oldText: "previous note",
      newText: "updated note",
      criteria: "mention the launch",
      apiKey: "secret-key",
    });

    assert.equal(request.url, JEV_DECIDE_URL);
    assert.equal(request.method, "POST");
    assert.equal(request.headers.Authorization, "Bearer secret-key");
    assert.equal(request.headers["Content-Type"], "application/json");
    assert.deepEqual(request.body, body);
    assert.equal(body.state.old_text, "previous note");
    assert.equal(body.state.new_text, "updated note");
    assert.equal(body.questions.matches_criteria.type, "noul");
    assert.equal(body.questions.matches_criteria.instructions, INSTRUCTIONS);
    assert.equal(body.questions.matches_criteria.criteria.true, "mention the launch");
    assert.equal(JSON.stringify(body).includes("secret-key"), false);
  });
});

describe("criteria test and repeat suppression", () => {
  it("asks a choice question about the current note and keeps the key on the request", () => {
    const body = jevCriteriaTestBody({
      note: "Launch is Friday",
      criteria: "A blocker is added",
    });
    const request = jevAuthedRequest("secret-key", body);

    assert.equal(request.headers.Authorization, "Bearer secret-key");
    assert.equal(body.questions.current.type, "choice");
    assert.equal(body.state.note, "Launch is Friday");
    assert.equal(body.state.condition, "A blocker is added");
    assert.equal(JSON.stringify(body).includes("secret-key"), false);
    assert.equal(JSON.stringify(body).includes("email"), false);
    assert.equal(readCriteriaVerdict({ answers: { current: { choice: "matches" } } }), "matches");
    assert.equal(readCriteriaVerdict({ answers: { current: { choice: "misses" } } }), "misses");
    assert.equal(readCriteriaVerdict({ answers: { current: { choice: "future" } } }), "future");
    assert.equal(readCriteriaVerdict({ answers: { current: { choice: "other" } } }), null);
    assert.equal(readCriteriaVerdict(null), null);
    assert.equal(CRITERIA_VERDICT_COPY.matches, "Matches this note");
    assert.equal(CRITERIA_VERDICT_COPY.misses, "Doesn't match this note");
    assert.equal(CRITERIA_VERDICT_COPY.future, "Needs a future change to match");
    assert.deepEqual(parseCriteriaTest({ criteria: "  launch date  " }), {
      criteria: "launch date",
    });
  });

  it("emails a criteria match only on a false-to-true edge unless every change was requested", () => {
    const body = jevRepeatBody("tell me every time the date changes");
    assert.equal(body.questions.cadence.type, "choice");
    assert.equal(readRepeatsEveryChange({ answers: { cadence: { choice: "every" } } }), true);
    assert.equal(readRepeatsEveryChange({ answers: { cadence: { choice: "edge" } } }), false);
    assert.equal(readRepeatsEveryChange({}), false);

    assert.deepEqual(
      criteriaEmailDecision({ matched: true, previouslyMatched: false, repeats: false }),
      { email: true, matched: true },
    );
    assert.deepEqual(
      criteriaEmailDecision({ matched: true, previouslyMatched: true, repeats: false }),
      { email: false, matched: true },
    );
    assert.deepEqual(
      criteriaEmailDecision({ matched: false, previouslyMatched: true, repeats: false }),
      { email: false, matched: false },
    );
    assert.deepEqual(
      criteriaEmailDecision({ matched: true, previouslyMatched: false, repeats: false }),
      { email: true, matched: true },
    );
    assert.deepEqual(
      criteriaEmailDecision({ matched: true, previouslyMatched: true, repeats: true }),
      { email: true, matched: true },
    );
  });
});

describe("criteria match threshold", () => {
  it("sends at 0.5 and above, and skips lower or unusable answers", () => {
    assert.equal(criteriaMatches({ answers: { matches_criteria: { noul: 0.5 } } }), true);
    assert.equal(criteriaMatches({ answers: { matches_criteria: { noul: 0.9 } } }), true);
    assert.equal(criteriaMatches({ answers: { matches_criteria: { noul: 0.49 } } }), false);
    assert.equal(criteriaMatches({ answers: { matches_criteria: { noul: 0 } } }), false);
    assert.equal(criteriaMatches({ answers: {} }), false);
    assert.equal(criteriaMatches({}), false);
    assert.equal(criteriaMatches(null), false);
    assert.equal(criteriaMatches({ answers: { matches_criteria: { noul: "0.8" } } }), false);
    assert.equal(criteriaMatches({ answers: { matches_criteria: { score: 1 } } }), false);
    assert.equal(criteriaMatches({ answers: { matches_criteria: { noul: Number.NaN } } }), false);

    assert.equal(shouldEmailNote("never", true), false);
    assert.equal(shouldEmailNote("any", false), true);
    assert.equal(shouldEmailNote("criteria", true), true);
    assert.equal(shouldEmailNote("criteria", false), false);
  });
});

describe("note notification debounce", () => {
  it("arms three quiet minutes, keeps the first baseline, and delivers that pair", () => {
    const start = 1_000_000;
    const first = planNoteBurst({
      pending: null,
      previousContent: "alpha",
      nextContent: "beta",
      now: start,
    });

    assert.equal(first.deliver, null);
    assert.deepEqual(first.pending, {
      baseline: "alpha",
      latest: "beta",
      dueAt: start + NOTE_NOTIFY_QUIET_MS,
    });

    const second = planNoteBurst({
      pending: first.pending,
      previousContent: "beta",
      nextContent: "gamma",
      now: start + 60_000,
    });

    assert.equal(second.deliver, null);
    assert.equal(second.pending.baseline, "alpha");
    assert.equal(second.pending.latest, "gamma");
    assert.equal(second.pending.dueAt, start + 60_000 + NOTE_NOTIFY_QUIET_MS);
    assert.deepEqual(noteBurstDelivery(second.pending), { oldText: "alpha", newText: "gamma" });

    const due = planNoteBurst({
      pending: second.pending,
      previousContent: "gamma",
      nextContent: "delta",
      now: second.pending.dueAt,
    });

    assert.deepEqual(due.deliver, { oldText: "alpha", newText: "gamma" });
    assert.deepEqual(due.pending, {
      baseline: "gamma",
      latest: "delta",
      dueAt: second.pending.dueAt + NOTE_NOTIFY_QUIET_MS,
    });
  });

  it("skips a due burst whose text never changed", () => {
    const pending: NoteBurst = { baseline: "same", latest: "same", dueAt: 50 };
    const plan = planNoteBurst({
      pending,
      previousContent: "same",
      nextContent: "next",
      now: 50,
    });
    assert.equal(plan.deliver, null);
    assert.equal(noteBurstDelivery(pending), null);
  });
});

describe("note notification input", () => {
  it("requires criteria only for that mode and stores the other modes empty", () => {
    assert.deepEqual(parseNoteNotification({ mode: "never", criteria: "ignored text" }), {
      mode: "never",
      criteria: "",
    });
    assert.deepEqual(parseNoteNotification({ mode: "any" }), { mode: "any", criteria: "" });
    assert.deepEqual(
      parseNoteNotification({ mode: "criteria", criteria: "  when the price changes  " }),
      { mode: "criteria", criteria: "when the price changes" },
    );
    assert.throws(
      () => parseNoteNotification({ mode: "criteria", criteria: "   " }),
      (error: unknown) => error instanceof ZodError && /Describe the condition/.test(error.message),
    );
    assert.throws(
      () => parseNoteNotification({ mode: "criteria", criteria: "x".repeat(2001) }),
      (error: unknown) => error instanceof ZodError && /too long/.test(error.message),
    );
  });

  it("hooks note content changes and leaves title-only and diagram writes quiet", () => {
    const source = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const write = source.slice(
      source.indexOf("export async function updateDocumentContent"),
      source.indexOf("export async function deleteDocument"),
    );
    assert.match(write, /current\.type === "note" && written\.content !== current\.content/);
    assert.match(write, /onNoteContentChanged\(/);
    assert.equal(write.includes("JEV_API_KEY"), false);
  });
});
