# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Inferred from the shipped app and this conversation: a person who keeps notes and UML diagrams in one library, shares a document by link, and gives an agent a token so it can search and edit that library.

## Product Purpose

Pamiac is a desk for notes and UML diagrams. Each document has a direct link. The owner can share it as private, by email, by password, or in public. An agent token can search embeddings and create or update that owner's documents.

## Positioning

The library is readable and editable by the owner's agent, through one personal token and local embeddings. Shared visitors view. Owners edit.

## Operating Context

The app runs in the browser, signed in with a magic link. The library is at `/workspace`. The agent contract is a token the user copies. Documents live in Postgres. There is no payment provider wired up.

## Capabilities and Constraints

The signed-in account menu has a Plan entry. It opens `/profile`, three columns:

- Free, $0, 30 documents. This is the current plan. The action is enabled and labeled Current plan. Creating a document past 30 is refused.
- $5 per month, 200 documents. Disabled. The action says Coming soon.
- $20 per month, 1,500 documents. Disabled. The action says Coming soon.

Editors, retention, and version history are not on the paywall and are not enforced.

Inferred: viewers of a shared link stay on the free side of sharing. Prices are US dollars per month and are not charged yet.

## Brand Commitments

The product name is Pamiac. The interface already in the app is the visual authority for new screens: paper ground, ink text, teal accent, serif wordmark.

## Evidence on Hand

- Homepage and README describe notes, UML, sharing, and the agent token.
- No customer logos, testimonials, or payment receipts exist. Do not invent them.

## Product Principles

- The free desk has to be usable.
- A plan that cannot be bought says so on the control, and does not pretend to check out.
- The paywall states only what the account can actually do today.
