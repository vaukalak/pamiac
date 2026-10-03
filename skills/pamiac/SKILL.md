---
name: pamiac
description: Search, read, and edit the signed-in user's Pamiac notes and UML diagrams. Use when the user asks about their notes, diagrams, library, or UML.
---

# Pamiac

Pamiac is the signed-in user's library of markdown notes and UML diagrams. Use the Pamiac tools on that account. Do not ask for an API token, and do not invent a document id.

## Before you write

Call `search_documents` or `list_documents` before `create_note` or `create_diagram`, so you do not add a duplicate.

## Read

- `search_documents` finds notes and diagrams by meaning. Each result has `id`, `type`, `title`, `url`, `score`, and `excerpt`.
- `list_documents` lists the library. Pass `type` as `note` or `diagram` to filter. Each document has `id`, `type`, `title`, `url`, and `updatedAt`.
- `read_document` loads one document by `id`. It returns `id`, `type`, `title`, `url`, `updatedAt`, `version`, `content`, `text`, and `excerpt`. Call it before changing a diagram.
- `list_folders` lists folders this connection can reach. Each folder has `id`, `name`, `parentId` (null at the root), `workspaceId` (null for a personal folder), `visibility`, and `url`.
- `share_folder` sets a folder share. Send `id`, `visibility`, and `password` or `emails` when that mode needs them. Sharing a folder shares the folder and everything inside it, including nested folders and documents. The link is `/f/<id>` (the folder `url`). A folder share grants view, not edit, and does not change each document's own share.

## Notes

A note stores markdown in `content`.

- `create_note` adds a note. Send the full markdown as `content`.
- `update_note` replaces that note. Send the full markdown you want kept, not a fragment. Send `version` from `read_document`. On conflict, the tool returns the current `version`, `title`, and `content`. Re-apply the same change onto that content and update with that `version`.

## Diagrams

A diagram stores `nodes` and `relations` in `content`.

`kind` is `class`, `interface`, `component`, `package`, `entity`, `attribute`, `relationship`, `terminator`, `process`, `decision`, `data`, `document`, `database`, `usecase`, `person`, `role`, `department`, `actor`, `participant`, `activation`, `fragment`, or `note`.

Relation `type` is `association`, `inheritance`, `composition`, `aggregation`, `dependency`, or `realization`. A relation can name an element by id or by name.

- `create_diagram` adds the whole diagram. Omit `position` unless the user asked for a layout.
- `update_diagram` merges a change. In the same turn, call `read_document` and send only the nodes you change, using each `id` from that read. Send `version` from `read_document`. Pass `nodes`, `deleteNodes`, `relations`, and `deleteRelations` as arguments of `update_diagram`. Do not wrap them in `patch`. Omit other nodes. Omit `position` to keep the layout. A node object sets only the fields it contains. Those fields are `kind`, `name`, `stereotype`, `attributes`, `methods`, `body`, and `position`. When `attributes` or `methods` is present, it replaces that whole list. Use `deleteNodes` and `deleteRelations` only for elements the user asked to remove. On conflict, the tool returns the current `version`, `title`, and `content`. Re-apply onto that content, rebuild the change against that document, and update with that `version`. Do not resend a stale full replace that drops the other writer's work.

## Account

`get_profile` returns the signed-in account `id`, and `name` or `email` when the account has them.
