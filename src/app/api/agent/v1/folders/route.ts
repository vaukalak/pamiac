import { z } from "zod";
import { requireAgentUser } from "@/lib/documents";
import { presentListedFolder } from "@/lib/folder-library";
import { createAgentFolder, listAgentFolders } from "@/lib/folders";
import { agentJson, corsHeaders, errorResponse, readJson } from "@/lib/http";

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
