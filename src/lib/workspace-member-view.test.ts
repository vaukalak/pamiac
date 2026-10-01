import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  matchingMembers,
  matchingPending,
  memberInitials,
  memberJoinedLabel,
  memberRoleLabel,
  pendingSentLabel,
  sameMemberEmail,
} from "./workspace-member-view.ts";

describe("workspace member view", () => {
  it("builds initials from one word or the first two words", () => {
    assert.equal(memberInitials("Ada"), "A");
    assert.equal(memberInitials("Ada Lovelace"), "AL");
    assert.equal(memberInitials("  Ada   Lovelace  Byron "), "AL");
    assert.equal(memberInitials("école"), "É");
    assert.equal(memberInitials("   "), "");
  });

  it("labels the two membership roles", () => {
    assert.equal(memberRoleLabel("admin"), "Admin");
    assert.equal(memberRoleLabel("editor"), "Editor");
  });

  it("formats a join date in en-US and says sent today for the same calendar day", () => {
    const now = new Date(2026, 8, 30, 15, 0, 0);
    const today = new Date(2026, 8, 30, 8, 30, 0).toISOString();
    const earlier = new Date(2026, 8, 28, 8, 30, 0).toISOString();

    assert.equal(memberJoinedLabel(earlier), "Sep 28, 2026");
    assert.equal(pendingSentLabel(today, now), "Sent today");
    assert.equal(pendingSentLabel(earlier, now), "Sep 28, 2026");
    assert.equal(pendingSentLabel("not-a-date", now), "");
  });

  it("matches the signed-in email without caring about case", () => {
    assert.equal(sameMemberEmail("Ada@Example.com", "ada@example.com"), true);
    assert.equal(sameMemberEmail("ada@example.com", "ed@example.com"), false);
  });

  it("filters loaded people by name or email and by admin or editor", () => {
    const members = [
      { name: "Ada Lovelace", email: "ada@example.com", role: "admin" },
      { name: "Ed Editor", email: "ed@example.com", role: "editor" },
    ];

    assert.deepEqual(
      matchingMembers(members, "lovelace", "all").map((member) => member.email),
      ["ada@example.com"],
    );
    assert.deepEqual(
      matchingMembers(members, "example.com", "editor").map((member) => member.name),
      ["Ed Editor"],
    );
    assert.deepEqual(
      matchingMembers(members, "", "admin").map((member) => member.role),
      ["admin"],
    );
  });

  it("keeps waiting addresses out of a specific role filter", () => {
    const pending = [{ email: "ada@example.com" }, { email: "ed@example.com" }];

    assert.deepEqual(
      matchingPending(pending, "ed", "all").map((row) => row.email),
      ["ed@example.com"],
    );
    assert.deepEqual(matchingPending(pending, "", "admin"), []);
    assert.deepEqual(matchingPending(pending, "", "editor"), []);
  });
});
