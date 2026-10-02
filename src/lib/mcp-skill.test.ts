import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { createAnnotations, readAnnotations, replaceAnnotations } from "./mcp-annotations.ts";
import { starterPrompts } from "./mcp-prompts.ts";
import { pamiacSkill, skillFrontmatter, skillUri } from "./mcp-skill.ts";

test("the ChatGPT skill is a flat front matter file the portal can import", () => {
  const { entry, files } = pamiacSkill();
  const skill = files.find((file) => file.uri === skillUri);
  assert.ok(skill);
  assert.equal(entry.uri, skillUri);
  assert.deepEqual(entry.frontmatter, skillFrontmatter(skill.text));
  assert.equal(entry.frontmatter.name, "pamiac");
  assert.ok(entry.frontmatter.description.length <= 1024);
  assert.equal(skill.text.includes("PAMIAC_TOKEN"), false);
  assert.equal(skill.text.includes("/api/agent"), false);
  assert.equal(skill.text.includes("grok"), false);
  assert.equal(skill.text.includes("subagent"), false);
  assert.match(skill.text, /Do not wrap them in `patch`/);
  assert.deepEqual(
    entry.resources.map((resource) => resource.uri),
    files.map((file) => file.uri),
  );
  for (const file of files) {
    const bytes = Buffer.from(file.text, "utf8");
    assert.equal(file.digest, `sha256:${createHash("sha256").update(bytes).digest("hex")}`);
    assert.match(file.digest, /^sha256:[0-9a-f]{64}$/);
  }
  assert.equal(
    files.some((file) => file.uri.endsWith("/agents/openai.yaml")),
    true,
  );
});

test("starter prompts fit the directory form", () => {
  assert.equal(starterPrompts.length, 3);
  const seen = new Set<string>();
  for (const prompt of starterPrompts) {
    assert.equal(prompt.text.includes("\n"), false);
    assert.equal(prompt.text.includes("@"), false);
    assert.ok(prompt.text.length > 0);
    assert.ok(prompt.text.length <= 128);
    seen.add(prompt.text.normalize("NFKC").replace(/\s+/g, " ").trim());
  }
  assert.equal(seen.size, starterPrompts.length);
  const submission = readFileSync(new URL("../../chatgpt/submission.md", import.meta.url), "utf8");
  for (const prompt of starterPrompts) {
    assert.equal(submission.includes(prompt.text), true, prompt.name);
  }
  assert.equal(submission.includes("### Search a note"), true);
  assert.equal(submission.includes("### List diagrams"), true);
  assert.equal(submission.includes("### Create a note"), true);
  assert.equal(submission.includes("### Create a diagram"), true);
  assert.equal(submission.includes("### Update one class"), true);
  assert.equal(submission.includes("### Do not send email"), true);
  assert.equal(submission.includes("### Do not wipe the library"), true);
  assert.equal(submission.includes("### Do not browse the web"), true);
});

test("writes that overwrite or delete are marked destructive", () => {
  assert.equal(readAnnotations.readOnlyHint, true);
  assert.equal(readAnnotations.destructiveHint, false);
  assert.equal(readAnnotations.openWorldHint, false);
  assert.equal(createAnnotations.readOnlyHint, false);
  assert.equal(createAnnotations.destructiveHint, false);
  assert.equal(replaceAnnotations.readOnlyHint, false);
  assert.equal(replaceAnnotations.destructiveHint, true);
  assert.equal(replaceAnnotations.openWorldHint, false);
});
