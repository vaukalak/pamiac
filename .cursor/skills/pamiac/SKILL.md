---
name: pamiac
description: >-
  Read and edit a user's Pamiac notes and UML diagrams. Use when the user
  invokes /pamiac, or asks to search, read, or edit their Pamiac library.
---

# Pamiac

Read `PAMIAC_TOKEN` from the agent environment and send `Authorization: Bearer <PAMIAC_TOKEN>` on every request. Do not ask the user to paste the token. If `PAMIAC_TOKEN` is missing, say so and stop.

Do not print the token.

App: the origin the user is using. Ask for the app URL if you do not already know it.

Base: `/api/agent/v1`

## Search by meaning

`POST /search`

```json
{ "query": "checkout payment classes", "limit": 8 }
```

Search uses this user's document embeddings. Results include `id`, `type`, `title`, `url`, `score`, and `excerpt`.

## List, read, create, update

- `GET /documents`
- `GET /documents/:id`
- `POST /documents`
- `PATCH /documents/:id`

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

`GET /documents?type=note` or `GET /documents?type=diagram` filters the list.

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
