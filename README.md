# Pamiac

Notes and UML diagrams on Vercel. Magic-link accounts, direct document links, and an agent token that can search embeddings and edit the library.

## Setup

1. Create a Neon Postgres database and copy the pooled connection string.
2. Copy `.env.example` to `.env.local`.
3. Set `DATABASE_URL` and `BETTER_AUTH_SECRET`.
4. Install and migrate the schema, which also enables `pgvector`. The migration creates the library tables and the ChatGPT plugin tables `jwks`, `oauth_client`, `oauth_resource`, `oauth_client_resource`, `oauth_refresh_token`, `oauth_access_token`, `oauth_consent`, and `oauth_client_assertion`:

```bash
npm install
npm run db:migrate
npm run dev
```

Open http://localhost:3000. Without `RESEND_API_KEY`, the login page shows the magic link after you submit your email. In production, set `RESEND_API_KEY` and `EMAIL_FROM`.

In production, set `BETTER_AUTH_URL` to the public origin (`https://pamiac.com`) and set `BETTER_AUTH_API_KEY` to the Infrastructure project key so the dashboard can verify that origin.

Google sign-in is optional. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to show it beside the magic link. The redirect URI is `http://localhost:3000/api/auth/callback/google` locally and `https://pamiac.com/api/auth/callback/google` in production. Leave both empty to keep magic-link sign-in only.

## Sharing

Each document lives at `/d/<id>`.

- Private: only the owner
- Emails: invited people, signed in with that address, can view
- Password: anyone with the link and password can view
- Public: anyone with the link can view

Owners edit. Shared visitors view.

## Agents

Create a key under API keys and set it as `PAMIAC_TOKEN` in the agent environment. The `/pamiac` skill is `agent/SKILL.md`. The skill reads `PAMIAC_TOKEN` from the agent environment. When that variable is missing, the agent sends the user to a connect link, the user signs in and chooses Return to the agent name, and the key is claimed once by the agent. The token can list, read, create, and update that user's notes and diagrams, and search them by embedding. The same token in a `pamiac_token` cookie opens `/workspace` in a browser.

## ChatGPT plugin

ChatGPT Free and Go can install a plugin from the OpenAI plugin directory. That plugin is this app's MCP server. A pasted MCP URL is developer mode on Plus and above, not the free tier. The old `/.well-known/ai-plugin.json` store is not used.

- MCP URL: `/api/mcp` on the public origin (`https://your-app.example/api/mcp`).
- OAuth discovery: `/.well-known/oauth-protected-resource/api/mcp`, `/.well-known/oauth-authorization-server/api/auth`, and `/api/auth/.well-known/openid-configuration`.
- Sign-in stays the magic link, or Google when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set. Either path returns to the same login callback, then the consent screen at `/oauth/consent`. ChatGPT does not receive `PAMIAC_TOKEN`.
- Set `OPENAI_APPS_CHALLENGE` to the domain challenge from the OpenAI submission portal. `GET /.well-known/openai-apps-challenge` returns that value as `text/plain`.
- Scan Tools imports the skill at `skills/pamiac`. `chatgpt/submission.md` has the starter prompts, test cases, annotation justifications, and release notes for that form.
- Free-tier use requires submitting this MCP server in the OpenAI plugin directory. The API keys page shows the endpoint for that submission and for developer mode. The plugin is not listed until that submission is approved.
