import { requireMcpAuth } from "@better-auth/mcp";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { getAuth } from "@/lib/auth";
import { appBaseUrl } from "@/lib/config";
import { requestOrigin } from "@/lib/mcp-documents";
import { mcpResourceUrl } from "@/lib/mcp-resource";
import { createPamiacMcpServer } from "@/lib/mcp-server";
import { accessTokenUserId, mcpRequestUserId } from "@/lib/mcp-user";

const mcpHandler = createMcpHandler(
  (ctx) => {
    const origin = ctx.requestInfo ? requestOrigin(ctx.requestInfo) : appBaseUrl();
    return createPamiacMcpServer(mcpRequestUserId(ctx.authInfo), origin);
  },
  { legacy: "reject" },
);

async function handleMcp(request: Request, claims: { sub?: unknown; scope?: unknown }) {
  const userId = accessTokenUserId(claims);
  const scopes = typeof claims.scope === "string" ? claims.scope.split(" ").filter(Boolean) : [];
  return mcpHandler.fetch(request, {
    authInfo: {
      token: "",
      clientId: "",
      scopes,
      extra: { userId },
    },
  });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }
  return requireMcpAuth(getAuth(), handleMcp, { resource: mcpResourceUrl() })(request);
}
