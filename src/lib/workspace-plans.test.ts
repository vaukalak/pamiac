import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  currentWorkspacePlan,
  documentLabel,
  documentRoom,
  memberLabel,
  memberRoom,
  plans,
  workspacePlans,
} from "./plans.ts";

describe("workspace billing", () => {
  it("gives each workspace the same three columns as the account", () => {
    assert.deepEqual(
      workspacePlans.map((plan) => plan.name),
      plans.map((plan) => plan.name),
    );
    assert.deepEqual(
      workspacePlans.map((plan) => plan.price),
      ["$0", "per month", "per month"],
    );
    assert.deepEqual(
      workspacePlans.map((plan) => plan.documents),
      [30, 200, 1500],
    );
    assert.deepEqual(workspacePlans.map(documentLabel), [
      "30 documents",
      "200 documents",
      "1,500 documents",
    ]);
  });

  it("limits people to 3, 10, and 50 and keeps paid columns closed", () => {
    assert.deepEqual(
      workspacePlans.map((plan) => plan.members),
      [3, 10, 50],
    );
    assert.deepEqual(
      workspacePlans.map((plan) => memberLabel(plan.members)),
      ["3 people", "10 people", "50 people"],
    );
    assert.deepEqual(
      workspacePlans.map((plan) => plan.action),
      ["Current plan", "Coming soon", "Coming soon"],
    );
    assert.deepEqual(
      workspacePlans.map((plan) => plan.enabled),
      [true, false, false],
    );
  });

  it("keeps the account plan on documents only", () => {
    assert.equal(
      plans.every((plan) => plan.members == null),
      true,
    );
    const plan = currentWorkspacePlan();
    assert.equal(plan.name, "Free");
    assert.equal(plan.documents, 30);
    assert.equal(plan.members, 3);
    assert.equal(memberRoom(plan.members - 1, plan), null);
    assert.equal(memberRoom(plan.members, plan), "The Free plan holds 3 people.");
    assert.equal(documentRoom(plan.documents - 1, plan), null);
    assert.equal(documentRoom(plan.documents, plan), "The Free plan holds 30 documents.");
  });

  it("shows the workspace paywall only for an open created workspace", () => {
    const paywall = readFileSync(
      new URL("../components/plan/workspace-paywall.tsx", import.meta.url),
      "utf8",
    );
    const board = readFileSync(
      new URL("../components/library/document-board.tsx", import.meta.url),
      "utf8",
    );
    const manage = readFileSync(
      new URL("../components/library/library-manage.tsx", import.meta.url),
      "utf8",
    );
    const page = readFileSync(new URL("../app/workspace/page.tsx", import.meta.url), "utf8");
    const profile = readFileSync(new URL("../app/profile/page.tsx", import.meta.url), "utf8");
    const account = readFileSync(
      new URL("../components/plan/plan-paywall.tsx", import.meta.url),
      "utf8",
    );
    assert.match(paywall, /PERSONAL_SPACE_ID/);
    assert.match(paywall, /return null/);
    assert.match(paywall, /workspacePlans/);
    assert.match(paywall, /This workspace is on the free plan/);
    assert.equal(/checkout|stripe|charge/i.test(paywall), false);
    assert.equal(/WorkspacePaywall|plan-grid|workspacePlans/.test(board), false);
    assert.equal(/WorkspacePaywall|plan-grid|workspacePlans/.test(manage), false);
    assert.equal(/WorkspacePaywall|plan-grid|workspacePlans/.test(page), false);
    assert.match(manage, /workspaceId=\{workspaceId\}/);
    assert.match(profile, /PlanPaywall/);
    assert.equal(/WorkspacePaywall|workspacePlans/.test(profile), false);
    assert.match(account, /plans\.map/);
    assert.equal(/workspacePlans/.test(account), false);
    const column = readFileSync(
      new URL("../components/plan/plan-column.tsx", import.meta.url),
      "utf8",
    );
    assert.match(column, /memberLabel\(members\)/);
    assert.match(column, /members != null/);
    assert.match(column, /documentLabel\(plan\)/);
  });

  it("refuses a new person once members and pending invites fill the plan", () => {
    const people = readFileSync(new URL("./workspace-people.ts", import.meta.url), "utf8");
    const add = people.slice(people.indexOf("export async function addWorkspacePerson"));
    const counter = people.slice(
      people.indexOf("async function workspacePeopleCount"),
      people.indexOf("async function personAlreadyCounted"),
    );
    assert.match(counter, /workspaceMembers/);
    assert.match(counter, /workspaceInvites/);
    assert.equal(/userId/.test(counter), false);
    assert.ok(add.indexOf("Personal space cannot receive members") < add.indexOf("memberRoom"));
    assert.ok(add.indexOf("Workspace not found") < add.indexOf("memberRoom"));
    assert.ok(add.indexOf("personAlreadyCounted") < add.indexOf("memberRoom"));
    assert.match(add, /if \(!counted\)/);
    assert.match(add, /currentWorkspacePlan\(\)/);
    assert.match(add, /HttpError\(403/);
    assert.match(add, /delete\(workspaceInvites\)/);
  });

  it("counts a placed document on the workspace and leaves personal documents on the account", () => {
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const place = store.slice(
      store.indexOf("export async function placeDocumentInWorkspace"),
      store.indexOf("export async function listSpaceDocuments"),
    );
    const create = store.slice(
      store.indexOf("export async function createDocument"),
      store.indexOf("export async function getOwnedDocument"),
    );
    const gate = place.slice(
      place.indexOf("current.workspaceId !== libraryId"),
      place.indexOf("update(documents)"),
    );
    assert.match(place, /currentWorkspacePlan\(\)/);
    assert.match(gate, /documentRoom/);
    assert.match(gate, /documents\.workspaceId, libraryId/);
    assert.equal(/ownerId/.test(gate), false);
    assert.match(place, /HttpError\(403/);
    assert.match(create, /!document\.workspaceId/);
    assert.match(create, /documentRoom\(personal\.length, currentPlan\(\)\)/);
    assert.equal(create.includes("documentRoom(existing.length"), false);
    assert.match(create, /workspaceId: libraryId \?\? null/);
    assert.match(create, /eq\(documents\.workspaceId, libraryId\)/);
    assert.match(
      create,
      /documentRoom\(Number\(tally\?\.total \?\? 0\), currentWorkspacePlan\(\)\)/,
    );
    assert.match(create, /HttpError\(403, room\)/);
  });
});
