import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

const skillDirectory = path.join(process.cwd(), "skills", "pamiac");

export const skillUri = "skill://pamiac/pamiac/SKILL.md";

const skillFiles = [
  { name: "SKILL.md", uri: skillUri, mimeType: "text/markdown" },
  {
    name: "agents/openai.yaml",
    uri: "skill://pamiac/pamiac/agents/openai.yaml",
    mimeType: "text/yaml",
  },
] as const;

export interface SkillResource {
  uri: string;
  mimeType: string;
  text: string;
  digest: string;
}

export interface SkillEntry {
  uri: string;
  frontmatter: Record<string, string>;
  resources: Array<{ uri: string; digest: string }>;
}

function readSkillFile(name: string) {
  return readFileSync(path.join(skillDirectory, name));
}

function digest(bytes: Buffer) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

export function skillFrontmatter(markdown: string) {
  if (!markdown.startsWith("---\n")) throw new Error("Skill front matter missing");
  const end = markdown.indexOf("\n---\n", 4);
  if (end < 0) throw new Error("Skill front matter unclosed");
  const entries: Record<string, string> = {};
  for (const line of markdown.slice(4, end).split("\n")) {
    if (!line.trim()) continue;
    const split = line.indexOf(":");
    if (split < 0) throw new Error("Skill front matter is not a flat mapping");
    const key = line.slice(0, split).trim();
    const value = line.slice(split + 1).trim();
    if (!key || !value) throw new Error("Skill front matter has an empty entry");
    entries[key] = value;
  }
  if (!entries.name || !entries.description) {
    throw new Error("Skill front matter needs name and description");
  }
  return entries;
}

export function pamiacSkill(): { entry: SkillEntry; files: SkillResource[] } {
  const files = skillFiles.map((file) => {
    const bytes = readSkillFile(file.name);
    return {
      uri: file.uri,
      mimeType: file.mimeType,
      text: bytes.toString("utf8"),
      digest: digest(bytes),
    };
  });
  const skill = files[0];
  return {
    entry: {
      uri: skill.uri,
      frontmatter: skillFrontmatter(skill.text),
      resources: files.map((file) => ({ uri: file.uri, digest: file.digest })),
    },
    files,
  };
}

const listParams = z.object({
  cursor: z.string().optional(),
});

const getParams = z.object({
  uri: z.string(),
});

export function attachPamiacSkill(server: McpServer) {
  const { entry, files } = pamiacSkill();
  server.server.registerCapabilities({
    extensions: { "io.modelcontextprotocol/skills": {} },
  });
  for (const file of files) {
    server.registerResource(
      file.uri,
      file.uri,
      { mimeType: file.mimeType, description: "Pamiac skill file" },
      async (uri) => ({
        contents: [{ uri: uri.href, mimeType: file.mimeType, text: file.text }],
      }),
    );
  }
  server.server.setRequestHandler("skills/list", { params: listParams }, (params) => {
    if (params.cursor) return { skills: [] };
    return { skills: [entry] };
  });
  server.server.setRequestHandler("skills/get", { params: getParams }, (params) => {
    if (params.uri !== entry.uri) throw new Error("Skill not found");
    return { skill: entry };
  });
}
