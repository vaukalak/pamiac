import { z } from "zod";
import { VISIBILITIES } from "@/lib/access";
import { requireAgentUser } from "@/lib/documents";
import { updateFolderShare } from "@/lib/folders";
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

const shareSchema = z.object({
  visibility: z.enum(VISIBILITIES),
  password: z.string().max(200).optional(),
  emails: z.array(z.string()).max(50).optional(),
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const agent = await requireAgentUser(request);
    const { id } = await context.params;
    const input = shareSchema.parse(await readJson(request));
    const share = await updateFolderShare(agent.id, id, input, {
      scope: agent.scope,
      origin: origin(request),
    });
    return agentJson(share);
  } catch (error) {
    return errorResponse(error, true);
  }
}
