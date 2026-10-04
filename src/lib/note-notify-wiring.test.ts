import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { ZodError } from "zod";
import { criteriaEmailDecision, criteriaMatchResult, parseCriteriaTest } from "./note-notify.ts";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("criteria arm state", () => {
  it("treats an unusable decide payload as unknown, not as a miss that re-arms", () => {
    assert.equal(criteriaMatchResult({ answers: { matches_criteria: { noul: 0.2 } } }), false);
    assert.equal(criteriaMatchResult({ answers: { matches_criteria: { noul: 0.8 } } }), true);
    assert.equal(criteriaMatchResult({ answers: {} }), null);
    assert.equal(criteriaMatchResult({ answers: { matches_criteria: { noul: "0.9" } } }), null);
    assert.equal(criteriaMatchResult(null), null);
  });

  it("re-arms after a miss so a later false-to-true change can email again", () => {
    let previouslyMatched = false;
    const first = criteriaEmailDecision({
      matched: true,
      previouslyMatched,
      repeats: false,
    });
    assert.equal(first.email, true);
    previouslyMatched = first.matched;

    const held = criteriaEmailDecision({
      matched: true,
      previouslyMatched,
      repeats: false,
    });
    assert.equal(held.email, false);
    previouslyMatched = held.matched;

    const missed = criteriaEmailDecision({
      matched: false,
      previouslyMatched,
      repeats: false,
    });
    assert.equal(missed.email, false);
    previouslyMatched = missed.matched;

    const again = criteriaEmailDecision({
      matched: true,
      previouslyMatched,
      repeats: false,
    });
    assert.deepEqual(again, { email: true, matched: true });
  });

  it("rejects a blank or oversized condition before a test call", () => {
    assert.throws(
      () => parseCriteriaTest({ criteria: "   " }),
      (error: unknown) => error instanceof ZodError && /Describe the condition/.test(error.message),
    );
    assert.throws(
      () => parseCriteriaTest({ criteria: "x".repeat(2001) }),
      (error: unknown) => error instanceof ZodError && /too long/.test(error.message),
    );
  });
});

describe("note notification wiring", () => {
  it("keeps any-change mail on every burst, never mail off, and criteria mail on the edge", () => {
    const run = source("./note-notify-run.ts");
    const send = run.slice(run.indexOf("async function sendNoteUpdateEmail"));
    const criteria = run.slice(
      run.indexOf("async function sendCriteriaUpdate"),
      run.indexOf("async function sendNoteUpdateEmail"),
    );

    assert.match(send, /if \(mode === "never"\) return/);
    assert.match(send, /if \(mode === "criteria"\)/);
    assert.match(send, /deliverOwnerEmail\(/);
    assert.equal(send.includes("criteriaEmailDecision"), false);
    assert.match(criteria, /jevDecideBody\(/);
    assert.match(criteria, /if \(matched === null\) return/);
    assert.match(criteria, /criteriaEmailDecision\(/);
    assert.match(criteria, /criteriaMatched: decision\.matched/);
    assert.match(run, /criteriaMatched: false/);
    assert.match(
      run,
      /if \(!verdict\) throw new HttpError\(502, "Could not test this condition"\)/,
    );
    assert.equal(
      source("../components/note-notify/note-notify-test.tsx").includes("JEV_API_KEY"),
      false,
    );
    assert.equal(
      source("../app/api/documents/[id]/notification/test/route.ts").includes("JEV_API_KEY"),
      false,
    );
    assert.match(
      source("../app/api/documents/[id]/notification/test/route.ts"),
      /requireLibraryUser\(/,
    );
    assert.match(source("../../drizzle/0011_note-notification-arm.sql"), /criteria_matched/);
  });

  it("shows three choices, a condition field, and cancel or save without an email rule", () => {
    const draft = source("../components/note-notify/note-notify-draft.ts");
    const criteria = source("../components/note-notify/note-notify-criteria.tsx");
    const test = source("../components/note-notify/note-notify-test.tsx");
    const actions = source("../components/note-notify/note-notify-actions.tsx");
    const save = source("../components/note-notify/note-notify-save.tsx");
    const bell = source("../components/note-notify/note-notify-bell.tsx");
    const dialog = source("../components/note-notify/note-notify-dialog.tsx");
    const css = source("../app/globals.css");

    assert.match(draft, /Never/);
    assert.match(draft, /Any change/);
    assert.match(draft, /When matching criteria/);
    assert.equal(draft.toLowerCase().includes("email"), false);
    assert.equal(save.includes("Form.Select"), false);
    assert.match(criteria, /Describe the condition you want Pamiac to watch for\.\.\./);
    assert.match(criteria, /A blocker is added or the launch date changes/);
    assert.match(test, /Test criteria/);
    assert.match(actions, /Cancel/);
    assert.match(actions, /"Save"/);
    assert.match(bell, /Notifications off/);
    assert.match(bell, /Notifications: any change/);
    assert.match(bell, /Notifications: matching criteria/);
    assert.match(bell, /note-notify-dot/);
    assert.match(dialog, /max-width: 760px/);
    assert.match(css, /\.note-notify-layer/);
    assert.match(css, /max-width: 760px/);
  });
});
