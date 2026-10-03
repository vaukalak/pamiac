import { z } from "zod";
import { requireAgentUser } from "@/lib/documents";
import { moveAgentDocumentToFolder, moveAgentFolder } from "@/lib/folders";
import { agentJson, corsHeaders, errorResponse, readJson } from "@/lib/http";

const moveSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("document"),
    documentId: z.string().min(1),
    folderId: z.string().min(1).nullable(),
  }),
  z.object({
    kind: z.literal("folder"),
    folderId: z.string().min(1),
    parentId: z.string().min(1).nullable(),
  }),
]);

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request) {
  try {
    const agent = await requireAgentUser(request);
    const input = moveSchema.parse(await readJson(request));
    if (input.kind === "document") {
      const document = await moveAgentDocumentToFolder(
        agent.id,
        agent.scope,
        input.documentId,
        input.folderId,
      );
      return agentJson({ document });
    }
    const folder = await moveAgentFolder(agent.id, agent.scope, input.folderId, input.parentId);
    return agentJson({ folder });
  } catch (error) {
    return errorResponse(error, true);
  }
}
