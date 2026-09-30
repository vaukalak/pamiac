import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { afterEach, describe, it } from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { dash } from "@better-auth/infra";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const originalApiKey = process.env.BETTER_AUTH_API_KEY;

function restoreApiKey() {
  if (originalApiKey === undefined) delete process.env.BETTER_AUTH_API_KEY;
  else process.env.BETTER_AUTH_API_KEY = originalApiKey;
}

afterEach(() => {
  restoreApiKey();
});

describe("dash ownership plugin", () => {
  it("registers dash before nextCookies without extra infra features", () => {
    const auth = readFileSync(join(root, "src/lib/auth.ts"), "utf8");
    const client = readFileSync(join(root, "src/lib/auth-client.ts"), "utf8");
    const dashCall = auth.indexOf("dash({");
    const cookiesCall = auth.indexOf("nextCookies()");

    assert.ok(dashCall > 0);
    assert.ok(cookiesCall > dashCall);
    assert.match(auth, /import \{ dash \} from "@better-auth\/infra"/);
    assert.match(auth, /apiKey: process\.env\.BETTER_AUTH_API_KEY/);
    assert.doesNotMatch(auth, /activityTracking|managedDirectorySync|sentinel|dashClient/);
    assert.doesNotMatch(client, /dashClient|@better-auth\/infra/);
  });

  it("exposes GET /dash/validate when the API key is missing", () => {
    delete process.env.BETTER_AUTH_API_KEY;
    const plugin = dash({ apiKey: process.env.BETTER_AUTH_API_KEY });

    assert.equal(plugin.id, "dash");
    assert.equal(plugin.endpoints.getDashValidate.path, "/dash/validate");
    assert.equal(plugin.endpoints.getDashValidate.options.method, "GET");
    assert.deepEqual(plugin.schema, {});
    assert.notEqual(plugin.options.activityTracking?.enabled, true);
    assert.equal(plugin.options.managedDirectorySync?.enabled, false);
  });

  it("passes the project API key through to the plugin", () => {
    process.env.BETTER_AUTH_API_KEY = "project-key";
    const plugin = dash({ apiKey: process.env.BETTER_AUTH_API_KEY });

    assert.equal(plugin.options.apiKey, "project-key");
    assert.deepEqual(plugin.schema, {});
  });
});

describe("dash ownership setup", () => {
  it("documents the infrastructure key and the public origin", () => {
    const example = readFileSync(join(root, ".env.example"), "utf8");
    const readme = readFileSync(join(root, "README.md"), "utf8");

    assert.match(example, /^BETTER_AUTH_URL=$/m);
    assert.match(example, /^BETTER_AUTH_API_KEY=$/m);
    assert.doesNotMatch(example, /^# BETTER_AUTH_API_KEY=$/m);
    assert.match(example, /https:\/\/pamiac\.com/);
    assert.match(example, /\/dash\/config/);
    assert.match(example, /Better Auth Infrastructure project API key/);
    assert.match(readme, /set `BETTER_AUTH_URL` to the public origin \(`https:\/\/pamiac\.com`\)/);
    assert.match(
      readme,
      /set `BETTER_AUTH_API_KEY` to the Infrastructure project key so the dashboard can verify that origin/,
    );
    assert.doesNotMatch(readme, /vercel\.app/);
  });
});
