---
name: pamiac
description: Read and edit a user's Pamiac notes and UML diagrams with a personal access token. Use when working with Pamiac documents, UML, or the user's diagram library.
---

# Pamiac agent access

Read `PAMIAC_TOKEN` from the process environment (the agent environment). Send `Authorization: Bearer <PAMIAC_TOKEN>` on every request, using that value. Do not ask the user to paste the token. If `PAMIAC_TOKEN` is missing, say so and stop. Do not invent a token.

The app base URL is the origin the user is using. When you do not already know that URL, the user can give it to you.

## Search by meaning

`POST /api/agent/v1/search`

```json
{ "query": "checkout payment classes", "limit": 8 }
```

Results are ranked with that user's document embeddings and include `id`, `type`, `title`, `url`, `score`, and `excerpt`.

## List, read, create, update

- `GET /api/agent/v1/documents?type=diagram`
- `GET /api/agent/v1/documents/:id`
- `POST /api/agent/v1/documents`
- `PATCH /api/agent/v1/documents/:id`

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

`from` and `to` may be an element id or its name. Omit `position` to keep the user's current layout.

`GET /api/agent/v1` returns this contract when the token is valid.
