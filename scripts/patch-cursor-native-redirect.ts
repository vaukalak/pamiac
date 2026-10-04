import { readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CURSOR_NATIVE_CALLBACK_ALLOWLIST,
  NATIVE_PRIVATE_USE_REDIRECT_CHECK,
  patchCursorNativeRedirectBundle,
} from "../src/lib/cursor-native-redirect-patch.ts";

const root = join(process.cwd(), "node_modules", "@better-auth");
const seen = new Set<string>();
const files: string[] = [];

function walk(directory: string) {
  let realDirectory: string;
  try {
    realDirectory = realpathSync(directory);
  } catch {
    return;
  }
  if (seen.has(realDirectory)) return;
  seen.add(realDirectory);
  let entries;
  try {
    entries = readdirSync(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      walk(path);
      continue;
    }
    let file = entry.isFile();
    if (entry.isSymbolicLink()) {
      try {
        file = statSync(path).isFile();
        if (statSync(path).isDirectory()) walk(path);
      } catch {
        file = false;
      }
    }
    if (file && entry.name.endsWith(".mjs")) files.push(path);
  }
}

walk(root);

let patched = 0;
let alreadyPatched = 0;

for (const path of files) {
  const source = readFileSync(path, "utf8");
  if (source.includes(CURSOR_NATIVE_CALLBACK_ALLOWLIST)) {
    alreadyPatched += 1;
    continue;
  }
  if (!source.includes(NATIVE_PRIVATE_USE_REDIRECT_CHECK)) continue;
  const next = patchCursorNativeRedirectBundle(source);
  if (next === source) continue;
  writeFileSync(path, next);
  patched += 1;
}

if (patched === 0 && alreadyPatched === 0) {
  console.error("No Better Auth bundle contained the native private-use redirect check.");
  process.exit(1);
}
