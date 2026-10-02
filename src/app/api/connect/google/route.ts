import { z } from "zod";
import { decideGoogleAgentLogin } from "@/lib/google-agent-login";
import { requireUserId } from "@/lib/documents";
import { errorResponse, json, readJson } from "@/lib/http";

const decideSchema = z.object({
  userCode: z.string(),
  decision: z.enum(["approve", "deny"]),
});

export async function POST(request: Request) {
  try {
    const user = await requireUserId();
    const input = decideSchema.parse(await readJson(request));
    await decideGoogleAgentLogin(user.id, input.userCode, input.decision);
    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
