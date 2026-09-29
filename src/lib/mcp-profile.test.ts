import assert from "node:assert/strict";
import test from "node:test";
import { profileContent } from "./mcp-profile.ts";

test("profile keeps a stable id and optional name and email", () => {
  assert.deepEqual(profileContent({ id: " user-1 ", name: " Ada ", email: "ada@example.com" }), {
    id: "user-1",
    name: "Ada",
    email: "ada@example.com",
  });
});

test("profile omits blank optional fields and does not invent a nickname", () => {
  const profile = profileContent({ id: "user-1", name: "   ", email: "" });
  assert.deepEqual(profile, { id: "user-1" });
  assert.equal("nickname" in profile, false);
  assert.equal("name" in profile, false);
  assert.equal("email" in profile, false);
});

test("profile treats null optional fields as absent", () => {
  assert.deepEqual(profileContent({ id: "user-1", name: null, email: null }), { id: "user-1" });
});

test("profile errors when the id is empty", () => {
  assert.throws(() => profileContent({ id: "  ", name: "Ada", email: "ada@example.com" }), {
    message: "Profile id is empty",
  });
});
