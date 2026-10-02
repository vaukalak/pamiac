import { requireMcpAuth } from "@better-auth/mcp";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { getAuth } from "@/lib/auth";
import { ensureLiveJwks } from "@/lib/ensure-jwks";
import { appBaseUrl } from "@/lib/config";
import { authenticateAgentToken } from "@/lib/documents";
import { requestOrigin } from "@/lib/mcp-documents";
import { mcpResourceUrl } from "@/lib/mcp-resource";
import { createPamiacMcpServer } from "@/lib/mcp-server";
import { accessTokenUserId, mcpRequestScope, mcpRequestUserId } from "@/lib/mcp-user";

const mcpHandler = createMcpHandler(
  (ctx) => {
    const origin = ctx.requestInfo ? requestOrigin(ctx.requestInfo) : appBaseUrl();
    return createPamiacMcpServer(
      mcpRequestUserId(ctx.authInfo),
      origin,
      mcpRequestScope(ctx.authInfo),
    );
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
      extra: { userId, scope: { allScopes: true, workspaceIds: [] } },
    },
  });
}

function bearerToken(request: Request) {
  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

function agentTokenError(status: "missing" | "invalid" | "expired") {
  if (status === "expired") return "Expired agent token";
  return "Invalid agent token";
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }
  const token = bearerToken(request);
  if (token.startsWith("pam_")) {
    const result = await authenticateAgentToken(token);
    if (result.status !== "ok") {
      return Response.json({ error: agentTokenError(result.status) }, { status: 401 });
    }
    return mcpHandler.fetch(request, {
      authInfo: {
        token: "",
        clientId: "",
        scopes: [],
        extra: { userId: result.user.id, scope: result.user.scope },
      },
    });
  }
  await ensureLiveJwks();
  return requireMcpAuth(getAuth(), handleMcp, { resource: mcpResourceUrl() })(request);
}
