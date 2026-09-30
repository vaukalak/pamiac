import { ZodError } from "zod";
import { HttpError, errorResponse, json, readJson } from "@/lib/http";
import { sendSupportRequest } from "@/lib/mail";
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
    return json({ ok: true });
  } catch (error) {
    return supportFailure(error);
  }
}
