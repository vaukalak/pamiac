# Pamiac

Notes and UML diagrams on Vercel. Magic-link accounts, direct document links, and an agent token that can search embeddings and edit the library.

## Setup

1. Create a Neon Postgres database and copy the pooled connection string.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL` and `BETTER_AUTH_SECRET`.
4. Install and push the schema, which also enables `pgvector`. The push creates the library tables and the ChatGPT plugin tables `jwks`, `oauth_client`, `oauth_resource`, `oauth_client_resource`, `oauth_refresh_token`, `oauth_access_token`, `oauth_consent`, and `oauth_client_assertion`:

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

Create a key under API keys and set it as `PAMIAC_TOKEN` in the agent environment. The `/pamiac` skill is `agent/SKILL.md`. The skill reads `PAMIAC_TOKEN` from the agent environment. The token can list, read, create, and update that user's notes and diagrams, and search them by embedding. The same token in a `pamiac_token` cookie opens `/workspace` in a browser.

## ChatGPT plugin

ChatGPT Free and Go can install a plugin from the OpenAI plugin directory. That plugin is this app's MCP server. A pasted MCP URL is developer mode on Plus and above, not the free tier. The old `/.well-known/ai-plugin.json` store is not used.

- MCP URL: `/api/mcp` on the public origin (`https://your-app.example/api/mcp`).
- OAuth discovery: `/.well-known/oauth-protected-resource/api/mcp`, `/.well-known/oauth-authorization-server/api/auth`, and `/api/auth/.well-known/openid-configuration`.
- Sign-in is the existing magic link, then the consent screen at `/oauth/consent`. ChatGPT does not receive `PAMIAC_TOKEN`.
- Set `OPENAI_APPS_CHALLENGE` to the domain challenge from the OpenAI submission portal. `GET /.well-known/openai-apps-challenge` returns that value as `text/plain`.
- Scan Tools imports the skill at `skills/pamiac`. `chatgpt/submission.md` has the starter prompts, test cases, annotation justifications, and release notes for that form.
- Free-tier use requires submitting this MCP server in the OpenAI plugin directory. The API keys page shows the endpoint for that submission and for developer mode. The plugin is not listed until that submission is approved.
