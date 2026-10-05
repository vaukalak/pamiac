import { ZodError } from "zod";
import { captureServerEvent, supportRequestSentEvent } from "@/lib/analytics";
import { HttpError, errorResponse, json, readJson } from "@/lib/http";
import { sendSupportRequest } from "@/lib/mail";
import { getSession } from "@/lib/session";
import { supportRequestSchema } from "@/lib/support";

function supportFailure(error: unknown) {
  if (error instanceof Error && !(error instanceof HttpError) && !(error instanceof ZodError)) {
    const message = error.message;
    if (
      message.startsWith("RESEND_API_KEY") ||
      message.startsWith("EMAIL_FROM") ||
      message.startsWith("Could not send the support")
    ) {
      return json({ error: message }, 500);
    }
  }
  return errorResponse(error);
}

export async function POST(request: Request) {
  try {
    const input = supportRequestSchema.parse(await readJson(request));
    await sendSupportRequest(input);
    try {
      const session = await getSession();
      const userId = session.status === "ok" ? (session.session?.user.id ?? null) : null;
      await captureServerEvent(supportRequestSentEvent(userId));
    } catch {
      // Analytics must not change the product result.
    }
    return json({ ok: true });
  } catch (error) {
    return supportFailure(error);
  }
}
