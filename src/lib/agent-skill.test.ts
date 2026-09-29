import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const published = readFileSync(new URL("../../agent/SKILL.md", import.meta.url), "utf8");
const cursorSkill = readFileSync(
  new URL("../../.cursor/skills/pamiac/SKILL.md", import.meta.url),
  "utf8",
);
const apiKeys = readFileSync(
  new URL("../components/tokens/token-manager.tsx", import.meta.url),
  "utf8",
);

const required = [
  "Read `PAMIAC_TOKEN` from the process environment (the agent environment)",
  "Authorization: Bearer <PAMIAC_TOKEN>",
  "Do not ask the user to paste the token.",
  "If `PAMIAC_TOKEN` is missing, say so and stop.",
  "Do not invent a token.",
  "Ask for the app URL if you do not already know it.",
  "Base: `/api/agent/v1`",
  "POST /api/agent/v1/search",
  "checkout payment classes",
  "Diagram relations can refer to an element by id or by name.",
  "GET `/api/agent/v1/documents/:id` in the same turn",
  "only the nodes you change",
  "Omit other nodes.",
  "Creating a node without an id still slugs from the name",
  "Notes remain a full markdown `content` replace.",
];

test("published skill and /pamiac skill are the same contract", () => {
  assert.equal(cursorSkill, published);
});

test("skill reads PAMIAC_TOKEN and does not ask the user to paste it", () => {
  for (const line of required) {
    assert.equal(published.includes(line), true, line);
  }
  assert.equal(published.includes("Ask the user for a Pamiac token"), false);
  assert.equal(published.includes("Bearer pam_..."), false);
});

test("API keys page gives the agent the same token rule", () => {
  assert.equal(
    apiKeys.includes(
      "Read PAMIAC_TOKEN from the agent environment and send Authorization: Bearer <PAMIAC_TOKEN> on every request. Do not ask the user to paste the token. If PAMIAC_TOKEN is missing, say so and stop.",
    ),
    true,
  );
  assert.equal(apiKeys.includes("Bearer pam_..."), false);
});
