import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = dirname(fileURLToPath(new URL("../app/globals.css", import.meta.url)));

export function readStylesheet() {
  const entry = readFileSync(join(appDirectory, "globals.css"), "utf8");
  const partials = [...entry.matchAll(/^@import\s+"(\.\/[^"]+)";/gm)].map((match) => match[1]);
  return partials.map((partial) => readFileSync(join(appDirectory, partial), "utf8")).join("");
}
