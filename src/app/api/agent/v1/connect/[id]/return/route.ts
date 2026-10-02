import { returnAgentConnect } from "@/lib/agent-connect-db";
import { requireUserId } from "@/lib/documents";
import { errorResponse, json } from "@/lib/http";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUserId();
    const { id } = await context.params;
    const result = await returnAgentConnect(id, user.id, new Date());
    return json({ status: result.status, agentName: result.agentName });
  } catch (error) {
    return errorResponse(error);
  }
}
