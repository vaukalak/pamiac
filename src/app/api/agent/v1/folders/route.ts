import { z } from "zod";
import { requireAgentUser } from "@/lib/documents";
import { createAgentFolder, listAgentFolders } from "@/lib/folders";
import { agentJson, corsHeaders, errorResponse, readJson } from "@/lib/http";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: Request) {
  try {
    const agent = await requireAgentUser(request);
    const folders = await listAgentFolders(agent.id, agent.scope);
    return agentJson({ folders });
  } catch (error) {
    return errorResponse(error, true);
  }
}

const createSchema = z.object({
  name: z.string(),
  workspaceId: z.string().min(1).optional(),
  parentId: z.string().min(1).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const agent = await requireAgentUser(request);
    const input = createSchema.parse(await readJson(request));
    const folder = await createAgentFolder(
      agent.id,
      agent.scope,
      input.name,
      input.workspaceId,
      input.parentId ?? null,
    );
    return agentJson({ folder }, 201);
  } catch (error) {
    return errorResponse(error, true);
  }
}
