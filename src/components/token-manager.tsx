"use client";

import { useEffect, useState } from "react";
import { TokenRow } from "@/components/token-row";

type TokenRecord = {
  id: string;
  name: string;
  tokenPrefix: string;
  secret: string | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

const SKILL = `Set PAMIAC_TOKEN in the cloud agent's environment to the token you just created. Read PAMIAC_TOKEN from the agent environment and send Authorization: Bearer <PAMIAC_TOKEN> on every request. Do not ask the user to paste the token. If PAMIAC_TOKEN is missing, say so and stop.

Authorization: Bearer <PAMIAC_TOKEN>
App: the origin the user is using. Ask for the app URL if you do not already know it.
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

export function TokenManager() {
  const [tokens, setTokens] = useState<TokenRecord[]>([]);
  const [name, setName] = useState("Cloud agent");
  const [error, setError] = useState("");
  const [skillMessage, setSkillMessage] = useState("");

  async function reload() {
    const response = await fetch("/api/tokens");
    if (!response.ok) return;
    const body = (await response.json()) as { tokens: TokenRecord[] };
    setTokens(body.tokens);
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

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = (await response.json()) as { token?: string; error?: string };
    if (!response.ok || !body.token) {
      setError(body.error ?? "Could not create a token");
      return;
    }
    await reload();
  }

  return (
    <div>
      <p className="eyebrow">Agents</p>
      <h1>Personal access token</h1>
      <p className="lede">
        Create a token and set PAMIAC_TOKEN in the cloud agent's environment to the token you just
        created. With it, the agent can search embeddings of your notes and diagrams, then read,
        update, or create them.
      </p>
      <form className="form-stack" onSubmit={create} style={{ maxWidth: 460 }}>
        <div>
          <label htmlFor="token-name">Token name</label>
          <input id="token-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <button className="btn" type="submit">
          Create token
        </button>
        {error ? <p className="error">{error}</p> : null}
      </form>
      <div className="token-list">
        {tokens.map((token) => (
          <TokenRow
            key={token.id}
            id={token.id}
            name={token.name}
            tokenPrefix={token.tokenPrefix}
            secret={token.secret}
            lastUsedAt={token.lastUsedAt}
            revokedAt={token.revokedAt}
            onRevoked={() => void reload()}
          />
        ))}
      </div>
      <h2>What to give the agent</h2>
      <div className="skill-actions">
        <button className="btn secondary" type="button" onClick={() => void copySkill()}>
          copy skill
        </button>
        <button className="btn secondary" type="button" onClick={downloadSkill}>
          download skill
        </button>
      </div>
      {skillMessage ? <p className="hint">{skillMessage}</p> : null}
      <pre className="skill">{SKILL}</pre>
    </div>
  );
}
