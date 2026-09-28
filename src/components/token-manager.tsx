"use client";

import { useEffect, useState } from "react";

type TokenRow = {
  id: string;
  name: string;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};

const SKILL = `Use a Pamiac token to read and edit the user's notes and UML diagrams.

Authorization: Bearer pam_...
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
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [name, setName] = useState("Cloud agent");
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function reload() {
    const response = await fetch("/api/tokens");
    if (!response.ok) return;
    const body = (await response.json()) as { tokens: TokenRow[] };
    setTokens(body.tokens);
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
    setSecret(body.token);
    await reload();
  }

  async function revoke(id: string) {
    await fetch(`/api/tokens?id=${id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <div>
      <p className="eyebrow">Agents</p>
      <h1>Personal access token</h1>
      <p className="lede">
        Create a token and give it to a cloud agent. With it, the agent can search embeddings of
        your notes and diagrams, then read, update, or create them.
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
      {secret ? (
        <div style={{ marginTop: 16 }}>
          <p>Copy this token now. Pamiac will not show it again.</p>
          <div className="secret">{secret}</div>
        </div>
      ) : null}
      <div className="token-list">
        {tokens.map((token) => (
          <div className="token-row" key={token.id}>
            <div>
              <strong>{token.name}</strong>
              <div className="hint">
                {token.tokenPrefix}… · {token.revokedAt ? "revoked" : token.lastUsedAt ? `used ${new Date(token.lastUsedAt).toLocaleString()}` : "never used"}
              </div>
            </div>
            {token.revokedAt ? null : (
              <button className="btn danger small" onClick={() => void revoke(token.id)} type="button">
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
      <h2>What to give the agent</h2>
      <pre className="skill">{SKILL}</pre>
    </div>
  );
}
