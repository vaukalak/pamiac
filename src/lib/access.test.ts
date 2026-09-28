import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEmails, resolveAccess } from "./access.ts";

const base = {
  isOwner: false,
  viewerEmail: null as string | null,
  allowedEmails: [] as string[],
  passwordOk: false,
};

test("owner can edit a private document", () => {
  assert.deepEqual(
    resolveAccess({ ...base, isOwner: true, visibility: "private" }),
    { level: "edit", reason: "owner" },
  );
});

test("public link is viewable without a session", () => {
  assert.equal(resolveAccess({ ...base, visibility: "public" }).level, "view");
});

test("password link stays locked until the cookie matches", () => {
  assert.equal(resolveAccess({ ...base, visibility: "password" }).reason, "password");
  assert.equal(
    resolveAccess({ ...base, visibility: "password", passwordOk: true }).level,
    "view",
  );
});

test("email share requires the invited account", () => {
  const allowedEmails = ["ada@example.com"];
  assert.equal(
    resolveAccess({ ...base, visibility: "emails", allowedEmails }).reason,
    "login",
  );
  assert.equal(
    resolveAccess({
      ...base,
      visibility: "emails",
      allowedEmails,
      viewerEmail: "other@example.com",
    }).reason,
    "email",
  );
  assert.equal(
    resolveAccess({
      ...base,
      visibility: "emails",
      allowedEmails,
      viewerEmail: "Ada@Example.com",
    }).level,
    "view",
  );
});

test("private documents are hidden from everyone else", () => {
  assert.equal(resolveAccess({ ...base, visibility: "private" }).level, "none");
});

test("email list is normalized", () => {
  assert.deepEqual(normalizeEmails([" Ada@Example.com ", "ada@example.com"]), ["ada@example.com"]);
  assert.throws(() => normalizeEmails(["not-an-email"]));
});
