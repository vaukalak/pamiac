---
name: pamiac
description: >-
  Read and edit a user's Pamiac notes and UML diagrams. Use when the user
  invokes /pamiac, or asks to search, read, or edit their Pamiac library.
---

# Pamiac

Use Grok 4.7 Medium reasoning (`grok-4.7-medium`). Do not use Cursor Fast mode or any model slug that ends in `-fast`. When launching a subagent, set `model` to `grok-4.7-medium`.

Use the `pamiac` MCP tools for search, list, read, create, and update. Do not call the document HTTP API with curl, fetch, or the shell.

Read `PAMIAC_TOKEN` from the process environment (the agent environment). The server sends `Authorization: Bearer <PAMIAC_TOKEN>` when that variable is set. Do not print the token. Do not ask the user to paste the token. Do not invent a token.

App: https://pamiac.com

## Browse in a browser

To browse the library in a browser, set a cookie on the app origin: name `pamiac_token`, value the PAMIAC_TOKEN value, path `/`. Then open `/workspace`. A document is `/d/<id>`. Do not print the token. `/workspace/tokens` still requires the magic-link session.

## Library

Call `search_documents`, `list_workspaces`, `list_documents`, `read_document`, `create_note`, `create_diagram`, `update_note`, `update_diagram`, `list_folders`, `create_folder`, `move_document_to_folder`, and `move_folder`.

### Search

`search_documents`

```json
{ "query": "checkout payment classes", "limit": 8 }
```

Search reaches the workspace this token was bound to, and a personal binding reaches only that user's personal documents. Results include `id`, `type`, `title`, `url`, `score`, and `excerpt`.

### Workspaces

`list_workspaces` lists the workspaces this connection can reach. Call it when the user does not name a workspace. When more than one workspace is returned, list those workspaces and ask the user which one to use before searching, reading, or writing. Do not guess. One workspace needs no question.

### Folders

`list_folders`, `create_folder`, `move_document_to_folder`, and `move_folder` place notes and diagrams in folders.

- `list_folders` returns `{ folders }` with `id`, `name`, `parentId`, and `workspaceId`. `workspaceId` is null for the personal library.
- `create_folder` takes `name`, optional `parentId`, and optional `workspaceId`. When `workspaceId` is omitted, the folder is created in the same library `create_note` would use. The parent must be in that library.
- `move_document_to_folder` takes `documentId` and `folderId`. `folderId` null moves the document to the library root.
- `move_folder` takes `folderId` and `parentId`. `parentId` null moves the folder to the library root. A folder cannot move into itself.

### List, read, create, update

- `list_documents` lists notes and diagrams. Pass `type` as `note` or `diagram` to filter. Each document includes `folderId`.
- `read_document` loads one document by `id`. The payload includes `folderId`.
- `create_note` adds a markdown note.
- `create_diagram` adds a diagram.
- `update_note` replaces a note.
- `update_diagram` merges a diagram change.

Create a diagram:

```json
{
  "title": "Checkout",
  "nodes": [
    {
      "kind": "class",
      "name": "Order",
      "attributes": ["total: number"],
      "methods": ["pay(): void"]
    }
  ],
  "relations": []
}
```

Update a note. Send `version` from `read_document` in the same turn:

```json
{ "content": "# updated markdown", "version": 3 }
```

Notes store markdown in `content`. Diagrams store:

```json
{
  "nodes": [
    {
      "kind": "class",
      "name": "Order",
      "attributes": ["total: number"],
      "methods": ["pay(): void"]
    }
  ],
  "relations": [
    { "from": "Order", "to": "Payment", "type": "composition", "label": "charges" }
  ]
}
```

`kind` is `class`, `interface`, `actor`, `usecase`, `package`, `component`, or `note`.

`type` on a relation is `association`, `inheritance`, `composition`, `aggregation`, `dependency`, or `realization`.

Diagram relations can refer to an element by id or by name. Omit `position` to keep the user's current layout.

Update one diagram without replacing the others' work. Call `read_document` in the same turn before a diagram change. Send `update_diagram` with only the nodes you change, using each id from that read. Omit other nodes. Omit `position` to keep the layout. Send `version` from that read.

```json
{
  "version": 4,
  "nodes": [{ "id": "user", "methods": ["login(): void"] }],
  "deleteNodes": [],
  "relations": [
    {
      "id": "rel-1",
      "from": "user",
      "to": "order",
      "type": "association",
      "label": "places"
    }
  ],
  "deleteRelations": []
}
```

A node object sets only the fields it contains. Those fields are `kind`, `name`, `stereotype`, `attributes`, `methods`, `body`, and `position`. When `attributes` or `methods` is present, it replaces that whole list. A node absent from the update stays. You can send `title` beside the changed nodes.

Notes remain a full markdown `content` replace. Creating a node without an id still slugs from the name when you send full `content`. Do not send full diagram `content` to change a node.

A matching `version` writes and the response includes the new `version`. On conflict the tool returns the current `version`, `title`, and `content`. Re-apply onto that content. Rebuild a diagram `patch` against the new document. Do not resend a stale full replace that drops the other writer's work.

## When the pamiac MCP server is not connected

Use that flow only when the pamiac MCP tools are not available.

If the sandbox, proxy, or safety check refuses `https://pamiac.com` (including `host_not_allowed` or a data-exfiltration flag), stop. Tell the user this session must allow `https://pamiac.com`. Do not send that request through the browser, Chrome, a proxy, or another tool. Do not ask the user to paste a token. Do not invent a token.

If `PAMIAC_TOKEN` is missing, do not stop and do not ask for a pasted token. Offer sign-in with Google. Say this connects Cursor, Grok, Cloud, Codex, DeepSeek, and any other agent the same way.

`POST https://pamiac.com/api/agent/v1/google-login` with JSON `{ "agent": "cursor" }` (or `grok`, `cloud`, `codex`, `deepseek`, or another short agent name). No `Authorization` header.

Success body: `{ "deviceCode", "userCode", "verificationUrl", "intervalSeconds", "expiresIn" }`. `verificationUrl` is the absolute app origin plus `/connect/google?user_code=<userCode>`.

Tell the user to open `verificationUrl` and sign in with Google. Show `userCode`. If the agent can open a browser, open that URL. Do not ask for a Google password.

Poll `GET https://pamiac.com/api/agent/v1/google-login?device_code=<deviceCode>` every `intervalSeconds` until it finishes or expires.

- `{ "status": "pending" }` means wait and poll again.
- `{ "status": "ready", "token": "pam_..." }` means use that token as Bearer for the rest of the session. Do not print it. Do not ask the user to paste it.
- `{ "status": "denied" }` means stop.
- `{ "status": "expired" }` means start the POST again once.

If the POST returns that Google sign-in is not configured, say so and stop. Do not invent a token.

Once a token exists (`PAMIAC_TOKEN` in the environment, or status `ready` from Google login), call the document HTTP API with `Authorization: Bearer` and that token. Do not print the token. This HTTP API is only for a session where the pamiac MCP tools are not available.

- `GET https://pamiac.com/api/agent/v1/workspaces` returns `{ workspaces }`. Same rule as `list_workspaces`: more than one workspace means list them and ask; one workspace needs no question.
- `GET https://pamiac.com/api/agent/v1/folders` returns `{ folders }` with `id`, `name`, `parentId`, and `workspaceId`. `workspaceId` is null for the personal library.
- `POST https://pamiac.com/api/agent/v1/folders` with JSON `{ "name": "Notes", "workspaceId" optional, "parentId" optional }`. When `workspaceId` is omitted, the folder is created in the same library as a new note.
- `POST https://pamiac.com/api/agent/v1/folders/move` with JSON `{ "kind": "document", "documentId": "...", "folderId": null }` or `{ "kind": "folder", "folderId": "...", "parentId": null }`. `folderId` null moves a document to the library root. `parentId` null moves a folder to the library root.
- `POST https://pamiac.com/api/agent/v1/search` with JSON `{ "query": "checkout payment classes", "limit": 8 }`. Results include `id`, `type`, `title`, `url`, `score`, and `excerpt`.
- `GET https://pamiac.com/api/agent/v1/documents` with optional query `type=note` or `type=diagram`.
- `GET https://pamiac.com/api/agent/v1/documents/<id>`
- `POST https://pamiac.com/api/agent/v1/documents` with JSON `{ "type": "note" | "diagram", "title" optional, "content" optional }`. Note content is markdown. Diagram content is `{ nodes, relations }`.
- `PATCH https://pamiac.com/api/agent/v1/documents/<id>`

Notes stay a full markdown content replace plus `version` from the GET in the same turn:

```json
{ "content": "# updated markdown", "version": 3 }
```

Diagrams: the HTTP body wraps the merge in `patch`. Do not send nodes at the top level of the PATCH body.

```json
{
  "version": 4,
  "patch": {
    "nodes": [{ "id": "user", "methods": ["login(): void"] }],
    "deleteNodes": [],
    "relations": [
      {
        "id": "rel-1",
        "from": "user",
        "to": "order",
        "type": "association",
        "label": "places"
      }
    ],
    "deleteRelations": []
  }
}
```

Same field rules as `update_diagram`: only fields present, omit other nodes, omit `position` to keep layout. A version conflict returns the current `version`, `title`, and `content`.
