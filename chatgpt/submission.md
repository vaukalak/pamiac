# ChatGPT plugin submission

Upload `chatgpt/pamiac-plugin.zip`. The archive root is the plugin: `plugin.json`, `mcp.json`, `assets/`, and `skills/pamiac`. That skill is the same text the MCP server serves from `skills/pamiac`. It does not mention a model name or `PAMIAC_TOKEN`.

## Listing

Display name: Pamiac

Short description: Notes and UML diagrams

Long description:

Pamiac keeps the notes and UML diagrams you already have. Search the library, open a note, and edit a diagram without replacing the rest of it. Sign in with the magic link you already use on pamiac.com. ChatGPT does not receive an API key.

Capabilities:

- Search notes and diagrams
- Read a note or diagram
- Create a markdown note
- Create a UML diagram
- Update a note
- Update one part of a diagram

Website: https://pamiac.com

Support: https://pamiac.com/support

Brand color: #b9f542

Brand color, dark: #8ed42a

Icons, square PNG and SVG, at least 48×48:

- `chatgpt/assets/logo.png` — directory logo on a light surface. Dark tile, lime note behind a brighter diagram card.
- `chatgpt/assets/logo-dark.png` — directory logo on a dark surface. Lime tile, ink note and diagram.
- `chatgpt/assets/icon.png` — composer icon. Ink cards on a transparent ground.
- `chatgpt/assets/icon-dark.png` — composer icon for a dark composer. Lime cards on a transparent ground.

The site favicon is the same mark: `src/app/icon.svg`, with `src/app/apple-icon.png` for Apple touch.

Privacy policy: https://pamiac.com/privacy

Terms: https://pamiac.com/terms

## Starter prompts

Find my notes about checkout and summarize what they say.

Draw a UML class diagram of an order, a payment, and how they connect.

Add a login method to the user class on my checkout diagram.

## Positive tests

### Search a note

User prompt: Find my notes about checkout and summarize what they say.

Expected behavior: Call search_documents with a checkout query. When a note is the best hit, call read_document with that id and summarize the markdown. Do not create a document.

Result shape: A short summary plus the note url. search_documents returns results with id, type, title, url, score, and excerpt.

Fixture: A note titled Checkout whose markdown mentions payment.

### List diagrams

User prompt: What diagrams are in my library?

Expected behavior: Call list_documents with type diagram. Answer from that list. Do not create a document.

Result shape: documents with id, type, title, url, and updatedAt. type is diagram.

Fixture: At least one diagram in the demo account.

### Create a note

User prompt: Save a note titled Standup with two bullets, ship the plugin and verify the domain.

Expected behavior: Search or list first. If Standup is absent, call create_note with that title and both bullets in the markdown.

Result shape: The new note id, title, url, and markdown content.

Fixture: No existing note titled Standup.

### Create a diagram

User prompt: Draw a UML class diagram of an order, a payment, and how they connect.

Expected behavior: Search or list first. If that diagram is absent, call create_diagram with class nodes Order and Payment and one relation between them. Omit position.

Result shape: A diagram whose content has those two class nodes and one relation, plus url.

Fixture: No existing diagram with that title.

### Update one class

User prompt: Add a login method to the user class on my checkout diagram.

Expected behavior: Find the Checkout diagram, call read_document, then update_diagram with only the User node. Send that node's id and a methods list that includes login(): void. Omit position and omit the other nodes.

Result shape: The returned diagram still has the other nodes. The User node methods include login(): void. url is present.

Fixture: A diagram titled Checkout with a class named User.

## Negative tests

### Do not send email

User prompt: Email my checkout notes to the whole company.

Expected behavior: Do not call a Pamiac tool to send mail. Say the plugin cannot email anyone.

Why: The tools only read and edit the signed-in library. There is no send tool.

### Do not wipe the library

User prompt: Delete every note and diagram in my library.

Expected behavior: Do not call update_note or update_diagram to empty the library. Say that this plugin does not delete the whole library.

Why: update_note and update_diagram edit one document. A library wipe is not one of those edits.

### Do not browse the web

User prompt: Look up the weather in Minsk and save it only if it will rain.

Expected behavior: Do not invent a forecast and do not call create_note. Say Pamiac cannot look up the weather.

Why: Every tool stays inside the signed-in library. None of them read the public web.

## Annotation justifications

get_profile, search_documents, list_documents, and read_document:

- readOnlyHint true. The tool only reads the signed-in account.
- destructiveHint false. It cannot delete, overwrite, or send anything.
- openWorldHint false. It stays inside this user's Pamiac library.

create_note and create_diagram:

- readOnlyHint false. The tool creates a document in the signed-in account.
- destructiveHint false. It adds a document and does not delete or overwrite an existing one.
- openWorldHint false. The new document stays in the private account.

update_note:

- readOnlyHint false. The tool replaces the markdown of an existing note.
- destructiveHint true. It overwrites the note body, and this tool does not undo that write.
- openWorldHint false. The change stays in the private account.

update_diagram:

- readOnlyHint false. The tool changes an existing diagram.
- destructiveHint true. deleteNodes and deleteRelations remove elements, and sending attributes or methods replaces that whole list.
- openWorldHint false. The change stays in the private account.

## Release notes

First submission of the Pamiac plugin. It signs in with the existing magic link and exposes the signed-in library through MCP: search, list, read, create a note, create a diagram, replace a note, and merge a diagram edit. The bundled skill tells the model to search before creating and to patch a diagram with ids from a read in the same turn.

## Reviewer account

Login: openaireview@pamiac.com

Password: AAAaaa1!

Sign in with email and password on https://pamiac.com/login. There is no second factor and no sign-up step. The account should already contain the Checkout note and the Checkout diagram from the tests above.
