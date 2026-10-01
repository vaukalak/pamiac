import { z } from "zod";
import {
  agentCreateWorkspace,
  createDocument,
  listAgentDocuments,
  presentDocument,
  requireAgentUser,
  updateDocumentContent,
} from "@/lib/documents";
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
    const type = new URL(request.url).searchParams.get("type");
    const rows = await listAgentDocuments(agent.id, agent.scope);
    const documents = rows
      .filter((row) => !type || row.type === type)
      .map((row) => presentDocument(row, origin(request)));
    return agentJson({ documents });
  } catch (error) {
    return errorResponse(error, true);
  }
}

const createSchema = z.object({
  type: z.enum(["note", "diagram"]),
  title: z.string().max(160).optional(),
  content: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    const agent = await requireAgentUser(request);
    const input = createSchema.parse(await readJson(request));
    const workspaceId = await agentCreateWorkspace(agent.id, agent.scope);
    const created = await createDocument(agent.id, input.type, input.title, workspaceId);
    const document =
      input.content === undefined
        ? created
        : await updateDocumentContent(
            agent.id,
            created.id,
            { content: input.content },
            agent.scope,
          );
    return agentJson(presentDocument(document, origin(request)), 201);
  } catch (error) {
    return errorResponse(error, true);
  }
}
