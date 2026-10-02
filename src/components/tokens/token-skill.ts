export const TOKEN_SKILL = `Read PAMIAC_TOKEN from the agent environment. The pamiac MCP server sends Authorization: Bearer <PAMIAC_TOKEN> when that variable is set. Do not print the token. Do not ask the user to paste the token. Do not invent a token.

Use the pamiac MCP tools for search, list, read, create, and update. Do not curl the document API. Call list_workspaces, search_documents, list_documents, read_document, create_note, create_diagram, update_note, and update_diagram.

search_documents
{ "query": "checkout payment classes", "limit": 8 }

list_workspaces lists the workspaces this connection can reach. Call it when the user does not name a workspace. When more than one workspace is returned, list those workspaces and ask the user which one to use before searching, reading, or writing. Do not guess. One workspace needs no question.

All scopes reach personal documents and every workspace the user belongs to. A selected scope reaches only the chosen spaces. Diagram relations can refer to an element by id or by name.

Notes remain a full markdown content replace. Call read_document in the same turn before a diagram change. Send only the nodes you change. Omit other nodes. Omit position to keep layout. Send version from that read. On conflict the tool returns the current version, title, and content. Re-apply onto that content. Rebuild a diagram patch against the new document. Do not resend a stale full replace.

App: https://pamiac.com

If the pamiac MCP tools are not available, use this Google flow. If PAMIAC_TOKEN is missing, do not stop and do not ask for a pasted token. Offer sign-in with Google. Say this connects Cursor, Grok, Cloud, Codex, DeepSeek, and any other agent the same way.

POST https://pamiac.com/api/agent/v1/google-login with JSON { "agent": "cursor" } (or grok, cloud, codex, deepseek, or another short agent name). No Authorization header.

Success body: { "deviceCode", "userCode", "verificationUrl", "intervalSeconds", "expiresIn" }. verificationUrl is the absolute app origin plus /connect/google?user_code=<userCode>.

Tell the user to open verificationUrl and sign in with Google. Show userCode. If the agent can open a browser, open that URL. Do not ask for a Google password.

Poll GET https://pamiac.com/api/agent/v1/google-login?device_code=<deviceCode> every intervalSeconds until it finishes or expires.
{ "status": "pending" } means wait and poll again.
{ "status": "ready", "token": "pam_..." } means use that token as Bearer for the rest of the session. Do not print it. Do not ask the user to paste it.
{ "status": "denied" } means stop.
{ "status": "expired" } means start the POST again once.

If POST returns that Google sign-in is not configured, say so and stop. Do not invent a token.

To browse the library in a browser, set a cookie on the app origin: name pamiac_token, value the PAMIAC_TOKEN value, path /. Then open /workspace. A document is /d/<id>. Do not print the token. /workspace/tokens still requires the magic-link session.`;

export const TOKEN_SKILL_FILE = `---
name: pamiac
description: Read and edit a user's Pamiac notes and UML diagrams. Use when working with Pamiac documents, UML, or the user's diagram library.
fast: false
---

${TOKEN_SKILL}`;
