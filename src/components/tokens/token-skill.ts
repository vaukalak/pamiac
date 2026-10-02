export const TOKEN_SKILL = `Read PAMIAC_TOKEN from the agent environment and send Authorization: Bearer <PAMIAC_TOKEN> on every request. Do not ask the user to paste the token. If PAMIAC_TOKEN is missing, do not open the agent browser and do not ask the user to paste a token. Do not invent a token.
POST /api/agent/v1/connect with { "agentName": "<this agent's name>" }.
Tell the user to open the returned url in their own browser and choose Return to that name.
Poll GET /api/agent/v1/connect/:id until status is ready.
The ready body includes token once. Send Authorization: Bearer with that value for the rest of this run. Do not print the token. Do not put the token in a message to the user.
A later run still reads PAMIAC_TOKEN from the process environment.

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
