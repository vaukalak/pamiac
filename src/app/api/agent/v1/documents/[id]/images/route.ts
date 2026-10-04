import { z } from "zod";
import { requireAgentUser } from "@/lib/documents";
import { decodeImageBase64 } from "@/lib/image-base64";
import { agentJson, corsHeaders, errorResponse, readJson } from "@/lib/http";
import { uploadAgentNoteImage } from "@/lib/note-image";

const imageBody = z
  .object({
    data: z.string(),
    mediaType: z.string().optional(),
  })
  .strict();

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const agent = await requireAgentUser(request);
    const { id } = await context.params;
    const input = imageBody.parse(await readJson(request));
    const uploaded = await uploadAgentNoteImage(
      agent.id,
      id,
      { bytes: decodeImageBase64(input.data), type: input.mediaType ?? "" },
      agent.scope,
    );
    return agentJson({ url: uploaded.url });
  } catch (error) {
    return errorResponse(error, true);
  }
}
