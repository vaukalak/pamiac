import { listAgentWorkspaces, requireAgentUser } from "@/lib/documents";
import { agentJson, corsHeaders, errorResponse } from "@/lib/http";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  try {
    const agent = await requireAgentUser(request);
    const workspaces = await listAgentWorkspaces(agent.id, agent.scope);
    return agentJson({ workspaces });
  } catch (error) {
    return errorResponse(error, true);
  }
}
