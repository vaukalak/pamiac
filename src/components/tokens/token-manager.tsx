"use client";

import { useEffect, useState } from "react";
import type { AgentToken } from "@/components/tokens/agent-token";
import { TokenForm } from "@/components/tokens/token-form";
import { TokenList } from "@/components/tokens/token-list";
import { TokenSecret } from "@/components/tokens/token-secret";

const SKILL = `Read PAMIAC_TOKEN from the agent environment and send Authorization: Bearer <PAMIAC_TOKEN> on every request. Do not ask the user to paste the token. If PAMIAC_TOKEN is missing, say so and stop.

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
  const [tokens, setTokens] = useState<AgentToken[]>([]);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState("");

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

  useEffect(() => {
    void reload();
  }, []);

  return (
    <div>
      <h1>API keys</h1>
      <p className="lede">
        Create a key, choose when it expires, and set it as PAMIAC_TOKEN in the agent environment.
        The agent can search, read, and edit your notes and diagrams.
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
      <pre className="skill">{SKILL}</pre>
    </div>
  );
}
