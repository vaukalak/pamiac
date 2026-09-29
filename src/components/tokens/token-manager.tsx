"use client";

import { useEffect, useState } from "react";
import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenForm } from "@/components/tokens/token-form";
import { TokenList } from "@/components/tokens/token-list";
import { TokenSecret } from "@/components/tokens/token-secret";

const SKILL = `Read PAMIAC_TOKEN from the agent environment and send Authorization: Bearer <PAMIAC_TOKEN> on every request. Do not ask the user to paste the token. If PAMIAC_TOKEN is missing, say so and stop.

Authorization: Bearer <PAMIAC_TOKEN>
App: https://pamiac.com
Base: /api/agent/v1

POST /search
{ "query": "checkout payment classes", "limit": 8 }

GET /documents
GET /documents/:id
POST /documents
{ "type": "diagram", "title": "Checkout", "content": { "nodes": [{ "kind": "class", "name": "Order", "attributes": ["total: number"], "methods": ["pay(): void"] }], "relations": [] } }
PATCH /documents/:id
{ "content": "# updated markdown" }

Search uses this user's document embeddings. Diagram relations can refer to an element by id or by name.`;

const INSTRUCTIONS = `Save the Pamiac skill so later chats can use it. Write the file below and do not change its text. The user sets PAMIAC_TOKEN. Do not ask the user to paste the token.

Cursor, every project: ~/.cursor/skills/pamiac/SKILL.md
Cursor, this project only: .cursor/skills/pamiac/SKILL.md

Claude Code, every project: ~/.claude/skills/pamiac/SKILL.md
Claude Code, this project only: .claude/skills/pamiac/SKILL.md

Claude in the browser: open Customize, then Skills, create a skill named pamiac, and paste the file below.

Other agents: save the same file as SKILL.md in that agent's skills folder, inside a directory named pamiac.

The folder name and the frontmatter name must both be pamiac.

---
name: pamiac
description: Read and edit a user's Pamiac notes and UML diagrams. Use when working with Pamiac documents, UML, or the user's diagram library.
---

${SKILL}`;

export function TokenManager() {
  const [tokens, setTokens] = useState<AgentToken[]>([]);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [skillMessage, setSkillMessage] = useState("");

  async function reload() {
    try {
      const response = await fetch("/api/tokens");
      if (!response.ok) {
        setError("Could not load API keys");
        return;
      }
      const body = (await response.json()) as { tokens: AgentToken[] };
      setTokens(body.tokens);
      setError("");
    } catch {
      setError("Could not load API keys");
    }
  }

  async function copySkill() {
    setSkillMessage("");
    try {
      await navigator.clipboard.writeText(SKILL);
      setSkillMessage("Skill copied.");
    } catch {
      setSkillMessage("Could not copy the skill.");
    }
  }

  async function copyInstructions() {
    setSkillMessage("");
    try {
      await navigator.clipboard.writeText(INSTRUCTIONS);
      setSkillMessage("Instructions copied.");
    } catch {
      setSkillMessage("Could not copy the instructions.");
    }
  }

  function downloadSkill() {
    const file = new Blob([SKILL], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "SKILL.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div>
      <h1>API keys</h1>
      <p className="lede">
        Create a key, choose when it expires, and set PAMIAC_TOKEN in the cloud agent's environment
        to the token you just created. The agent can search, read, and edit your notes and diagrams.
      </p>
      <TokenForm
        onCreated={(value) => {
          setSecret(value);
          void reload();
        }}
      />
      {secret ? <TokenSecret secret={secret} /> : null}
      {error ? <p className="error">{error}</p> : null}
      <TokenList tokens={tokens} onRevoked={() => void reload()} />
      <h2>What to give the agent</h2>
      <div className="skill-actions">
        <button className="btn secondary" onClick={() => void copySkill()} type="button">
          copy skill
        </button>
        <button className="btn secondary" onClick={() => void copyInstructions()} type="button">
          copy instructions
        </button>
        <button className="btn secondary" onClick={downloadSkill} type="button">
          download skill
        </button>
      </div>
      {skillMessage ? <p className="hint">{skillMessage}</p> : null}
      <pre className="skill">{SKILL}</pre>
    </div>
  );
}
