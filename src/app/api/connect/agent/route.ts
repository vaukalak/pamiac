import { listConnectConsents } from "@/lib/connect-consents";
import { requireUserId } from "@/lib/documents";
import { errorResponse, json } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUserId();
    const connections = await listConnectConsents(user.id);
    return json({
      name: user.name,
      email: user.email,
      connections,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
