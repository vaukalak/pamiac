import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const skillUrl = new URL("../../.cursor/skills/pamiac/SKILL.md", import.meta.url);
const oldSkillUrl = new URL("../../agent/SKILL.md", import.meta.url);
const readmeUrl = new URL("../../README.md", import.meta.url);

test("Cursor loads /pamiac from .cursor/skills/pamiac/SKILL.md", () => {
  const skill = readFileSync(skillUrl, "utf8");
  const readme = readFileSync(readmeUrl, "utf8");

  assert.equal(existsSync(oldSkillUrl), false);
  assert.match(skill, /^---\nname: pamiac\n/);
  assert.match(readme, /The `\/pamiac` skill is `\.cursor\/skills\/pamiac\/SKILL\.md`\./);
  assert.equal(readme.includes("`agent/SKILL.md`"), false);
});
