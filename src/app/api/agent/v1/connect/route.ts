import { z } from "zod";
import { createAgentConnect } from "@/lib/agent-connect-db";
import { agentJson, corsHeaders, errorResponse, readJson } from "@/lib/http";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

const bodySchema = z.object({
  agentName: z.string(),
});

export async function POST(request: Request) {
  try {
    const input = bodySchema.parse(await readJson(request));
    const created = await createAgentConnect(input.agentName, new Date());
    return agentJson(created, 201);
  } catch (error) {
    return errorResponse(error, true);
  }
}
