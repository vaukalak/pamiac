# Pamiac

Notes and UML diagrams on Vercel. Magic-link accounts, direct document links, and an agent token that can search embeddings and edit the library.

## Setup

1. Create a Neon Postgres database and copy the pooled connection string.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL` and `BETTER_AUTH_SECRET`.
4. Install and push the schema, which also enables `pgvector`:

```bash
npm install
npm run db:push
npm run dev
```

Open http://localhost:3000. Without `RESEND_API_KEY`, the login page shows the magic link after you submit your email. In production, set `RESEND_API_KEY` and `EMAIL_FROM`.

Deploy on Vercel with the same environment variables. `BETTER_AUTH_URL` must be the public origin, for example `https://your-app.vercel.app`.

## Sharing

Each document lives at `/d/<id>`.

- Private: only the owner
- Emails: invited people, signed in with that address, can view
- Password: anyone with the link and password can view
- Public: anyone with the link can view

Owners edit. Shared visitors view.

## Agents

Create a token under Agent token. The contract is in `agent/SKILL.md`. The token can list, read, create, and update that user's notes and diagrams, and search them by embedding.
