---
name: pamiac
description: >-
  Read and edit a user's Pamiac notes and UML diagrams. Use when the user
  invokes /pamiac, or asks to search, read, or edit their Pamiac library.
---

# Pamiac

Use Grok 4.7 Medium reasoning (`grok-4.7-medium`). Do not use Cursor Fast mode or any model slug that ends in `-fast`. When launching a subagent, set `model` to `grok-4.7-medium`.

Read `PAMIAC_TOKEN` from the process environment (the agent environment). Send `Authorization: Bearer <PAMIAC_TOKEN>` on every request, using that value. Do not ask the user to paste the token. If `PAMIAC_TOKEN` is missing, say so and stop. Do not invent a token.

Do not print the token.

## Browse in a browser

To browse the library in a browser, set a cookie on the app origin: name `pamiac_token`, value the PAMIAC_TOKEN value, path `/`. Then open `/workspace`. A document is `/d/<id>`. Do not print the token. `/workspace/tokens` still requires the magic-link session.

App: https://pamiac.com

Base: `/api/agent/v1`

## Search by meaning

`POST /api/agent/v1/search`

```json
{ "query": "checkout payment classes", "limit": 8 }
```

Search reaches the workspace this token was bound to, and a personal binding reaches only that user's personal documents. Results include `id`, `type`, `title`, `url`, `score`, and `excerpt`.

## List, read, create, update

- `GET /api/agent/v1/documents`
- `GET /api/agent/v1/documents?type=diagram`
- `GET /api/agent/v1/documents/:id`
- `POST /api/agent/v1/documents`
- `PATCH /api/agent/v1/documents/:id`

Create a diagram:

```json
{
  "type": "diagram",
  "title": "Checkout",
  "content": {
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
}
```

Update a note:

```json
{ "content": "# updated markdown" }
```

`GET /api/agent/v1/documents?type=note` or `GET /api/agent/v1/documents?type=diagram` filters the list.

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

Update one diagram without replacing the others' work. GET `/api/agent/v1/documents/:id` in the same turn before you change it. PATCH `patch` with only the nodes you change, using each id from that GET. Omit other nodes. Omit `position` to keep the layout.

```json
{
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

A node object sets only the fields it contains. Those fields are `kind`, `name`, `stereotype`, `attributes`, `methods`, `body`, and `position`. When `attributes` or `methods` is present, it replaces that whole list. A node absent from `patch.nodes` stays. You can send `title` beside `patch`.

`content` on a diagram PATCH is a full replace. Do not send it to change a node. Creating a node without an id still slugs from the name when you send full `content`. Notes remain a full markdown `content` replace.

`GET /api/agent/v1` returns this contract when the token is valid.
