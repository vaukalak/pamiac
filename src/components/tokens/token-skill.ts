export const TOKEN_SKILL = `Read PAMIAC_TOKEN from the agent environment and send Authorization: Bearer <PAMIAC_TOKEN> on every request. Do not print the token. Do not ask the user to paste the token. Do not invent a token.

If PAMIAC_TOKEN is missing, do not stop and do not ask for a pasted token. Offer sign-in with Google. Say this connects Cursor, Grok, Cloud, Codex, DeepSeek, and any other agent the same way.

POST https://pamiac.com/api/agent/v1/google-login with JSON { "agent": "cursor" } (or grok, cloud, codex, deepseek, or another short agent name). No Authorization header.

Success body: { "deviceCode", "userCode", "verificationUrl", "intervalSeconds", "expiresIn" }. verificationUrl is the absolute app origin plus /connect/google?user_code=<userCode>.

Tell the user to open verificationUrl and sign in with Google. Show userCode. If the agent can open a browser, open that URL. Do not ask for a Google password.

Poll GET https://pamiac.com/api/agent/v1/google-login?device_code=<deviceCode> every intervalSeconds until it finishes or expires.
{ "status": "pending" } means wait and poll again.
{ "status": "ready", "token": "pam_..." } means use that token as Bearer for the rest of the session. Do not print it. Do not ask the user to paste it.
{ "status": "denied" } means stop.
{ "status": "expired" } means start the POST again once.

If POST returns that Google sign-in is not configured, say so and stop. Do not invent a token.

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

All scopes reach personal documents and every workspace the user belongs to. A selected scope reaches only the chosen spaces. Diagram relations can refer to an element by id or by name.

GET /api/agent/v1/workspaces lists the workspaces this token can reach. If the user does not specify a workspace, or which workspace they mean is unclear, call GET /api/agent/v1/workspaces. When more than one workspace is returned, list those workspaces and ask the user which one to use before searching, reading, or writing. Do not guess. One workspace needs no question.

To browse the library in a browser, set a cookie on the app origin: name pamiac_token, value the PAMIAC_TOKEN value, path /. Then open /workspace. A document is /d/<id>. Do not print the token. /workspace/tokens still requires the magic-link session.`;

export const TOKEN_SKILL_FILE = `---
name: pamiac
description: Read and edit a user's Pamiac notes and UML diagrams. Use when working with Pamiac documents, UML, or the user's diagram library.
fast: false
---

${TOKEN_SKILL}`;
