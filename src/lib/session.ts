import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";

export async function getSession() {
  if (!process.env.DATABASE_URL) {
    return { status: "setup" as const, session: null };
  }
  try {
    const session = await getAuth().api.getSession({ headers: await headers() });
    return { status: "ok" as const, session };
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Could not reach the database";
    return { status: "error" as const, session: null, message };
  }
}
