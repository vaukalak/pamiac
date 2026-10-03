import { requireAgentUser } from "@/lib/documents";
import { listAgentFolders } from "@/lib/folders";
import { presentListedFolder } from "@/lib/folder-library";
import { agentJson, corsHeaders, errorResponse } from "@/lib/http";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function origin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  try {
    const agent = await requireAgentUser(request);
    const rows = await listAgentFolders(agent.id, agent.scope);
    const folders = rows.map((row) => presentListedFolder(row, origin(request)));
    return agentJson({ folders });
  } catch (error) {
    return errorResponse(error, true);
  }
}
