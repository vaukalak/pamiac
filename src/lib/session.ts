import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { ensureLiveJwks } from "@/lib/ensure-jwks";

export async function getSession() {
  if (!process.env.DATABASE_URL) {
    return { status: "setup" as const, session: null };
  }
  try {
    await ensureLiveJwks();
    const session = await getAuth().api.getSession({ headers: await headers() });
    return { status: "ok" as const, session };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Could not reach the database";
    return { status: "error" as const, session: null, message };
  }
}

export async function getLibrarySession() {
  const result = await getSession();
  if (result.status !== "ok" || result.session) return result;
  try {
    const { agentUserFromCookie } = await import("@/lib/documents");
    const user = await agentUserFromCookie();
    if (!user) return result;
    return { status: "ok" as const, session: { user } };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Could not reach the database";
    return { status: "error" as const, session: null, message };
  }
}
