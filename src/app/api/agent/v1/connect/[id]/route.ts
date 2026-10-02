import { readAgentConnect } from "@/lib/agent-connect-db";
import { agentJson, corsHeaders, errorResponse } from "@/lib/http";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    return agentJson(await readAgentConnect(id, new Date()));
  } catch (error) {
    return errorResponse(error, true);
  }
}
