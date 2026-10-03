import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { safeNext } from "./config.ts";
import {
  acceptWorkspaceInvite,
  fetchWorkspaceInvite,
  rejectWorkspaceInvite,
} from "./library-workspace-invites.ts";
import { sameInviteEmail, workspaceInvitePath } from "./workspace-invite-link.ts";

describe("workspace invitation", () => {
  it("builds a library link that names the invite", () => {
    assert.equal(workspaceInvitePath("invite-1"), "/workspace?invite=invite-1");
    assert.equal(workspaceInvitePath("a b/c?d"), "/workspace?invite=a%20b%2Fc%3Fd");
  });

  it("matches only the invited email, ignoring case and surrounding space", () => {
    assert.equal(sameInviteEmail("Ada@Example.com", "ada@example.com"), true);
    assert.equal(sameInviteEmail(" ada@example.com ", "ADA@example.com"), true);
    assert.equal(sameInviteEmail("ada@example.com", "grace@example.com"), false);
    assert.equal(sameInviteEmail("ada@example.com", ""), false);
    assert.equal(sameInviteEmail("", ""), false);
    assert.equal(sameInviteEmail("ada@example.com", "ada@example.com.evil"), false);
  });

  it("keeps the invite query through the existing login return path", () => {
    const next = workspaceInvitePath("invite 1");
    assert.equal(safeNext(next), "/workspace?invite=invite%201");
    assert.equal(safeNext("//workspace?invite=invite-1"), "/workspace");
  });

  it("loads the named invite and refuses a different account", async () => {
    const original = globalThis.fetch;
    const calls: string[] = [];
    globalThis.fetch = async (input) => {
      calls.push(String(input));
      if (String(input).endsWith("missing")) {
        return Response.json({ error: "Invitation not found" }, { status: 404 });
      }
      if (String(input).endsWith("other")) {
        return Response.json(
          { error: "This invitation is for a different email" },
          { status: 403 },
        );
      }
      return Response.json({ invite: { id: "invite-1", workspaceName: "Atlas" } });
    };
    try {
      assert.deepEqual(await fetchWorkspaceInvite("invite 1"), {
        id: "invite-1",
        workspaceName: "Atlas",
      });
      assert.equal(calls[0], "/api/workspace-invites/invite%201");
      await assert.rejects(fetchWorkspaceInvite("other"), /different email/);
      await assert.rejects(fetchWorkspaceInvite("missing"), /Invitation not found/);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("posts accept and reject without adding a member on reject", async () => {
    const original = globalThis.fetch;
    const calls: { url: string; method: string }[] = [];
    globalThis.fetch = async (input, init) => {
      calls.push({ url: String(input), method: String(init?.method ?? "GET") });
      if (String(input).endsWith("/reject-fail/reject")) {
        return Response.json(
          { error: "This invitation is for a different email" },
          { status: 403 },
        );
      }
      return Response.json({ ok: true });
    };
    try {
      await acceptWorkspaceInvite("invite 1");
      await rejectWorkspaceInvite("invite 1");
      await assert.rejects(rejectWorkspaceInvite("reject-fail"), /different email/);
      assert.deepEqual(calls, [
        { url: "/api/workspace-invites/invite%201/accept", method: "POST" },
        { url: "/api/workspace-invites/invite%201/reject", method: "POST" },
        { url: "/api/workspace-invites/reject-fail/reject", method: "POST" },
      ]);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("checks the signed-in email before adding a member or deleting the invite", () => {
    const source = readFileSync(new URL("./workspace-invites.ts", import.meta.url), "utf8");
    const accept = source.slice(
      source.indexOf("export async function acceptWorkspaceInvite"),
      source.indexOf("export async function rejectWorkspaceInvite"),
    );
    const reject = source.slice(source.indexOf("export async function rejectWorkspaceInvite"));
    assert.match(accept, /inviteForAccount/);
    assert.ok(accept.indexOf("inviteForAccount") < accept.indexOf("insert(workspaceMembers)"));
    assert.match(accept, /delete\(workspaceInvites\)/);
    assert.ok(
      accept.indexOf("insert(workspaceMembers)") < accept.indexOf("delete(workspaceInvites)"),
    );
    assert.match(reject, /inviteForAccount/);
    assert.match(reject, /delete\(workspaceInvites\)/);
    assert.equal(/workspaceMembers/.test(reject), false);
    assert.match(source, /sameInviteEmail/);
    assert.match(source, /This invitation is for a different email/);
  });

  it("sends the pending invite through Resend or the dev magic-link store", () => {
    const mail = readFileSync(new URL("./mail.ts", import.meta.url), "utf8");
    const people = readFileSync(new URL("./workspace-people.ts", import.meta.url), "utf8");
    const deliver = mail.slice(mail.indexOf("async function deliverEmail"));
    const invite = mail.slice(mail.indexOf("export async function sendWorkspaceInvite"));
    const magic = mail.slice(
      mail.indexOf("export async function sendMagicLink"),
      mail.indexOf("export async function sendWorkspaceInvite"),
    );
    const add = people.slice(people.indexOf("export async function addWorkspacePerson"));
    assert.match(deliver, /RESEND_API_KEY/);
    assert.match(deliver, /devMagicLinks/);
    assert.match(deliver, /NODE_ENV === "production"/);
    assert.match(invite, /deliverEmail/);
    assert.match(invite, /escapeHtml/);
    assert.match(invite, /send workspace invitations/);
    assert.match(magic, /deliverEmail/);
    assert.match(magic, /Sign in to Pamiac/);
    assert.match(magic, /send magic links/);
    assert.ok(
      add.indexOf("Personal space cannot receive members") < add.indexOf("sendWorkspaceInvite"),
    );
    assert.ok(add.indexOf("memberRoom") < add.indexOf("sendWorkspaceInvite"));
    const pending = add.slice(add.indexOf("insert(workspaceInvites)"));
    assert.ok(pending.indexOf("onConflictDoNothing") < pending.indexOf("sendWorkspaceInvite"));
  });

  it("opens the dialog from the invite link and returns unsigned people through login", () => {
    const page = readFileSync(new URL("../app/workspace/page.tsx", import.meta.url), "utf8");
    const dialog = readFileSync(
      new URL("../components/library/workspace-invite-dialog.tsx", import.meta.url),
      "utf8",
    );
    const actions = readFileSync(
      new URL("../components/library/workspace-invite-actions.tsx", import.meta.url),
      "utf8",
    );
    const body = readFileSync(
      new URL("../components/library/workspace-invite-body.tsx", import.meta.url),
      "utf8",
    );
    const choice = readFileSync(
      new URL("../components/library/workspace-invite-choice.tsx", import.meta.url),
      "utf8",
    );
    const acceptRoute = readFileSync(
      new URL("../app/api/workspace-invites/[id]/accept/route.ts", import.meta.url),
      "utf8",
    );
    const rejectRoute = readFileSync(
      new URL("../app/api/workspace-invites/[id]/reject/route.ts", import.meta.url),
      "utf8",
    );
    assert.match(page, /workspaceInvitePath\(inviteId\)/);
    assert.match(page, /\/login\?next=\$\{encodeURIComponent\(nextPath\)\}/);
    assert.match(page, /<WorkspaceInviteDialog inviteId=\{inviteId\} \/>/);
    assert.match(dialog, /router\.replace\("\/workspace"\)/);
    assert.equal(/acceptWorkspaceInvite/.test(dialog), false);
    assert.match(choice, /workspaceName/);
    assert.match(actions, /"Accept"/);
    assert.match(actions, /"Reject"/);
    assert.match(actions, /disabled=\{mutation\.isPending\}/);
    assert.match(body, /useQuery/);
    assert.match(body, /retry: false/);
    assert.equal(/useState/.test(body), false);
    assert.match(acceptRoute, /user\.email/);
    assert.match(acceptRoute, /acceptWorkspaceInvite/);
    assert.match(rejectRoute, /user\.email/);
    assert.match(rejectRoute, /rejectWorkspaceInvite/);
    assert.equal(/workspaceMembers/.test(rejectRoute), false);
  });
});
