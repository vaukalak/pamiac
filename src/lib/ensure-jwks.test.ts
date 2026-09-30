import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function ensureBeforeAuth(source: string) {
  const guard = source.indexOf("if (!process.env.DATABASE_URL)");
  const ensure = source.indexOf("await ensureLiveJwks()");
  const auth = source.indexOf("getAuth()");
  assert.ok(guard >= 0);
  assert.ok(ensure > guard);
  assert.ok(auth > ensure);
}

describe("ensureLiveJwks request entries", () => {
  it("repairs jwks after the database guard and before getAuth", () => {
    ensureBeforeAuth(read("src/lib/session.ts"));
    ensureBeforeAuth(read("src/lib/auth-request.ts"));
    ensureBeforeAuth(read("src/app/api/mcp/route.ts"));
  });

  it("keeps older jwks rows and caches only a successful secret", () => {
    const source = read("src/lib/ensure-jwks.ts");
    assert.match(source, /new Set<string>\(\)/);
    assert.match(source, /ensuredSecrets\.has\(secret\)/);
    assert.doesNotMatch(source, /catch\s*\{[\s\S]*ensuredSecrets\.add/);
    assert.doesNotMatch(source, /\.delete\(|delete\s+from/i);
    const successAdds = source.match(/ensuredSecrets\.add\(secret\)/g);
    assert.equal(successAdds?.length, 2);
  });
});
