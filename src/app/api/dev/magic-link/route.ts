import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { devMagicLinks } from "@/db/schema";
import { devMagicLinkVisible } from "@/lib/dev-magic-link";
import { json } from "@/lib/http";

export async function GET(request: Request) {
  if (!devMagicLinkVisible()) {
    return json({ error: "Not found" }, 404);
  }
  const email = new URL(request.url).searchParams.get("email")?.toLowerCase();
  if (!email) return json({ error: "Email is required" }, 400);
  const [row] = await getDb().select().from(devMagicLinks).where(eq(devMagicLinks.email, email));
  if (!row) return json({ error: "No magic link yet" }, 404);
  return json({ url: row.url });
}
