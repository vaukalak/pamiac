export const TOKEN_SKILL = `Read PAMIAC_TOKEN from the agent environment and send Authorization: Bearer <PAMIAC_TOKEN> on every request. Do not ask the user to paste the token. If PAMIAC_TOKEN is missing, say so and stop.

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

To browse the library in a browser, set a cookie on the app origin: name pamiac_token, value the PAMIAC_TOKEN value, path /. Then open /workspace. A document is /d/<id>. Do not print the token. /workspace/tokens still requires the magic-link session.`;

export const TOKEN_SKILL_FILE = `---
name: pamiac
description: Read and edit a user's Pamiac notes and UML diagrams. Use when working with Pamiac documents, UML, or the user's diagram library.
---

${TOKEN_SKILL}`;
