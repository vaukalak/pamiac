import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../../", import.meta.url);

function read(path: string) {
  return readFileSync(new URL(path, root), "utf8");
}

test("the ChatGPT plugin zip is the package folder and the served skill", () => {
  const served = read("skills/pamiac/SKILL.md");
  const packed = read("chatgpt/plugin/skills/pamiac/SKILL.md");
  const yaml = read("chatgpt/plugin/skills/pamiac/agents/openai.yaml");
  const manifest = JSON.parse(read("chatgpt/plugin/plugin.json")) as {
    name: string;
    version: string;
    extensions: {
      "com.openai": {
        interface: {
          displayName: string;
          shortDescription: string;
          developerName: string;
          defaultPrompt: string[];
          composerIcon: string;
          logo: string;
        };
        onboardingSkill: string;
        review: { test_cases: { positive: unknown[]; negative: unknown[] } };
      };
    };
  };
  const mcp = JSON.parse(read("chatgpt/plugin/mcp.json")) as {
    mcpServers: Record<string, { type: string; url: string }>;
  };

  assert.equal(packed, served);
  assert.equal(served.includes("PAMIAC_TOKEN"), false);
  assert.equal(served.includes("grok"), false);
  assert.equal(served.includes("Grok"), false);
  assert.match(served, /Do not wrap them in `patch`/);
  assert.match(served, /rebuild the change against that document/);
  assert.match(yaml, /url: https:\/\/pamiac\.com\/api\/mcp/);
  assert.equal(manifest.name, "pamiac");
  assert.equal(manifest.version, "1.0.0");
  assert.equal(manifest.extensions["com.openai"].interface.displayName, "Pamiac");
  assert.ok(manifest.extensions["com.openai"].interface.shortDescription.length <= 30);
  assert.equal(manifest.extensions["com.openai"].interface.developerName, "MIKHAIL BOUTYLIN");
  assert.equal(manifest.extensions["com.openai"].interface.defaultPrompt.length, 3);
  assert.equal(manifest.extensions["com.openai"].onboardingSkill, "./skills/pamiac/SKILL.md");
  assert.equal(manifest.extensions["com.openai"].review.test_cases.positive.length, 5);
  assert.equal(manifest.extensions["com.openai"].review.test_cases.negative.length, 3);
  assert.equal(mcp.mcpServers.pamiac.type, "streamable-http");
  assert.equal(mcp.mcpServers.pamiac.url, "https://pamiac.com/api/mcp");

  const listing = execFileSync("unzip", ["-Z1", "chatgpt/pamiac-plugin.zip"], {
    cwd: new URL(".", root),
    encoding: "utf8",
  })
    .trim()
    .split("\n")
    .sort();
  assert.deepEqual(listing, [
    "assets/icon.svg",
    "assets/logo.svg",
    "mcp.json",
    "plugin.json",
    "skills/pamiac/SKILL.md",
    "skills/pamiac/agents/openai.yaml",
  ]);
  const zipped = execFileSync(
    "unzip",
    ["-p", "chatgpt/pamiac-plugin.zip", "skills/pamiac/SKILL.md"],
    {
      cwd: new URL(".", root),
      encoding: "utf8",
    },
  );
  assert.equal(zipped, served);
});
