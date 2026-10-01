import {
  getAgentDocument,
  presentDocument,
  requireAgentUser,
  updateDocumentContent,
} from "@/lib/documents";
import { agentDocumentUpdateSchema } from "@/lib/document-write";
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

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const agent = await requireAgentUser(request);
    const { id } = await context.params;
    const document = await getAgentDocument(agent.id, id, agent.scope);
    if (!document) return agentJson({ error: "Document not found" }, 404);
    return agentJson(presentDocument(document, origin(request)));
  } catch (error) {
    return errorResponse(error, true);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const agent = await requireAgentUser(request);
    const { id } = await context.params;
    const current = await getAgentDocument(agent.id, id, agent.scope);
    if (!current) return agentJson({ error: "Document not found" }, 404);
    const input = agentDocumentUpdateSchema.parse(await readJson(request));
    const document = await updateDocumentContent(
      agent.id,
      id,
      {
        title: input.title,
        content: input.content,
        patch: input.patch,
        expectedVersion: input.version,
      },
      agent.scope,
    );
    return agentJson(presentDocument(document, origin(request)));
  } catch (error) {
    return errorResponse(error, true);
  }
}
