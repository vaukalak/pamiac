import { z } from "zod";
import { createGoogleAgentLogin, pollGoogleAgentLogin } from "@/lib/google-agent-login";
import { googleSignInEnabled } from "@/lib/google-sign-in";
import { agentJson, corsHeaders, errorResponse, readJson } from "@/lib/http";
import { requestOrigin } from "@/lib/mcp-documents";

export function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

const createSchema = z.object({
  agent: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    if (!googleSignInEnabled()) {
      return agentJson({ error: "Google sign-in is not configured" }, 503);
    }
    const input = createSchema.parse(await readJson(request));
    const created = await createGoogleAgentLogin({
      agent: input.agent,
      origin: requestOrigin(request),
    });
    return agentJson(created);
  } catch (error) {
    return errorResponse(error, true);
  }
}

export async function GET(request: Request) {
  try {
    const deviceCode = new URL(request.url).searchParams.get("device_code") ?? "";
    const result = await pollGoogleAgentLogin(deviceCode);
    return agentJson(result.body, result.status);
  } catch (error) {
    return errorResponse(error, true);
  }
}
