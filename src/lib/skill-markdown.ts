import { readFileSync } from "node:fs";
import { join } from "node:path";

export function publishedSkillMarkdown() {
  return readFileSync(join(process.cwd(), "agent", "SKILL.md"), "utf8");
}
