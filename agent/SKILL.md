---
name: pamiac
description: >-
  Read and edit a user's Pamiac notes and UML diagrams. Use when the user
  invokes /pamiac, or asks to search, read, or edit their Pamiac library.
---

# Pamiac

Read `PAMIAC_TOKEN` from the process environment (the agent environment). Send `Authorization: Bearer <PAMIAC_TOKEN>` on every request, using that value. Do not ask the user to paste the token. If `PAMIAC_TOKEN` is missing, say so and stop. Do not invent a token.

Do not print the token.

App: https://pamiac.com

Base: `/api/agent/v1`

## Search by meaning

`POST /api/agent/v1/search`

```json
{ "query": "checkout payment classes", "limit": 8 }
```

Search uses this user's document embeddings. Results include `id`, `type`, `title`, `url`, `score`, and `excerpt`.

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

`GET /api/agent/v1` returns this contract when the token is valid.
