import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { analyticsProperties, noteNotificationEvent } from "./analytics.ts";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const PIPELINE_STEPS = [
  "mode_never_cleared",
  "burst_armed",
  "immediate_delivery",
  "timer_fired",
  "claim_missed",
  "claimed",
  "skipped_same_text",
  "missing_note",
  "mode_never",
  "mode_any",
  "mode_criteria",
  "jev_missing_key",
  "jev_http",
  "jev_network",
  "jev_unreadable",
  "judge_unavailable",
  "match_unreadable",
  "not_matched",
  "matched_email",
  "matched_suppressed",
  "no_owner_email",
  "email_returned",
  "test_no_verdict",
  "timer_failed",
];

describe("note notification pipeline event", () => {
  it("records the step and short enums without note text, criteria, or email", () => {
    const event = noteNotificationEvent({
      userId: "user-1",
      documentId: "doc-1",
      step: "jev_http",
      mode: "criteria",
      source: "delivery",
      result: "502",
    });
    const suppressed = noteNotificationEvent({
      userId: "user-1",
      documentId: "doc-1",
      step: "matched_suppressed",
      mode: "criteria",
      source: "delivery",
      result: false,
    });

    assert.equal(event?.event, "note_notification");
    assert.equal(event?.distinctId, "user-1");
    assert.deepEqual(event?.properties, {
      documentId: "doc-1",
      step: "jev_http",
      mode: "criteria",
      source: "delivery",
      result: "502",
    });
    assert.equal(suppressed?.properties.result, false);
    assert.equal(
      noteNotificationEvent({
        userId: "ada@example.com",
        documentId: "doc-1",
        step: "timer_fired",
      }),
      null,
    );
    assert.equal(
      noteNotificationEvent({
        userId: "user-1",
        documentId: "doc-1",
        step: "when the launch date changes",
      }),
      null,
    );
    assert.equal(
      noteNotificationEvent({
        userId: "  ",
        documentId: "doc-1",
        step: "claimed",
      }),
      null,
    );

    const leaked = noteNotificationEvent({
      userId: "user-1",
      documentId: "doc-1",
      step: "matched_email",
      mode: "send the diary to ada@example.com",
      source: "inbox",
      result: "the private note mentions ada@example.com",
    });
    assert.deepEqual(leaked?.properties, {
      documentId: "doc-1",
      step: "matched_email",
    });
    const serialized = JSON.stringify(leaked?.properties);
    assert.equal(serialized.includes("@"), false);
    assert.equal(serialized.includes("private"), false);
    assert.equal(serialized.includes("diary"), false);
    assert.equal("delayMs" in (event?.properties ?? {}), false);

    const safe = analyticsProperties({
      documentId: "doc-1",
      step: "x".repeat(81),
      mode: "any",
      result: true,
      email: "ada@example.com",
      criteria: "mentions Ada",
    });
    assert.deepEqual(safe, { documentId: "doc-1", mode: "any", result: true });
  });
});

describe("note notification pipeline logs", () => {
  it("covers the silent branches with the note-notify prefix and the same steps", () => {
    const run = source("./note-notify-run.ts");
    const trace = run.slice(
      run.indexOf("async function noteNotifyTrace"),
      run.indexOf("function noteNotifyReturn"),
    );
    const arm = run.slice(
      run.indexOf("function armNoteTimer"),
      run.indexOf("async function ownedNote"),
    );
    const decide = run.slice(
      run.indexOf("async function postDecide"),
      run.indexOf("async function deliverOwnerEmail"),
    );
    const ownerMail = run.slice(
      run.indexOf("async function deliverOwnerEmail"),
      run.indexOf("async function sendCriteriaUpdate"),
    );
    const changed = run.slice(run.indexOf("export async function onNoteContentChanged"));
    const early = changed.slice(0, changed.indexOf("const now"));
    const eventCall = trace.slice(trace.indexOf("noteNotificationEvent({"), trace.indexOf("});"));

    assert.match(trace, /`note-notify \$\{JSON\.stringify\(line\)\}`/);
    assert.match(trace, /console\.error\(text\)/);
    assert.match(trace, /console\.info\(text\)/);
    assert.equal(trace.slice(0, trace.indexOf("JSON.stringify")).includes("userId"), false);
    assert.equal(eventCall.includes("delayMs"), false);
    assert.equal(eventCall.includes(".email"), false);
    assert.match(run, /Logging must not change whether the email sends/);

    assert.ok(arm.indexOf("console.error(error)") < arm.indexOf('step: "timer_failed"'));
    assert.match(decide, /step: "jev_missing_key"/);
    assert.match(decide, /step: "jev_http"/);
    assert.match(decide, /result: String\(response\.status\)/);
    assert.match(decide, /step: "jev_network"/);
    assert.match(decide, /step: "jev_unreadable"/);
    assert.equal(decide.includes("response.text"), false);
    assert.equal(decide.includes("await response.json()"), true);

    assert.match(ownerMail, /step: "no_owner_email"/);
    assert.ok(
      ownerMail.indexOf("await sendNoteUpdated") < ownerMail.indexOf('step: "email_returned"'),
    );
    assert.match(early, /previousContent === input\.nextContent\) return/);
    assert.equal(early.includes("noteNotify"), false);
    assert.match(changed, /step: "mode_never_cleared"/);
    assert.match(changed, /step: "immediate_delivery"/);
    assert.match(changed, /step: "burst_armed"/);
    assert.match(changed, /delayMs: Math\.max\(0, step\.dueAt - now\)/);

    const criteriaSend = run.slice(
      run.indexOf("async function sendCriteriaUpdate"),
      run.indexOf("async function sendNoteUpdateEmail"),
    );
    for (const step of PIPELINE_STEPS) {
      assert.match(run, new RegExp(`"${step}"`));
    }
    assert.match(criteriaSend, /decision\.matched \? "matched_suppressed" : "not_matched"/);

    const calls = run.match(/noteNotify(?:Trace|Return)\(\{[\s\S]*?\}\)/g) ?? [];
    const logged = calls.join("\n");
    for (const step of PIPELINE_STEPS) {
      assert.ok(logged.includes(`"${step}"`), step);
    }
    assert.ok(calls.length >= 20);
    for (const call of calls) {
      assert.equal(call.includes("oldText"), false);
      assert.equal(call.includes("newText"), false);
      assert.equal(call.includes("input.criteria"), false);
      assert.equal(call.includes("criteria:"), false);
      assert.equal(call.includes(".content"), false);
      assert.equal(call.includes("content:"), false);
      assert.equal(call.includes(".email"), false);
      assert.equal(call.includes("email:"), false);
      assert.equal(call.includes("title"), false);
      assert.equal(call.includes("apiKey"), false);
      assert.equal(call.includes("@"), false);
    }
  });
});
