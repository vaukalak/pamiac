import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { devMagicLinks } from "@/db/schema";

export async function sendMagicLink({ email, url }: { email: string; url: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is required to send magic links");
    }
    await getDb()
      .insert(devMagicLinks)
      .values({ email: email.toLowerCase(), url, createdAt: new Date() })
      .onConflictDoUpdate({
        target: devMagicLinks.email,
        set: { url, createdAt: new Date() },
      });
    console.info(`Magic link for ${email}: ${url}`);
    return;
  }

  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is required when RESEND_API_KEY is set");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "Your Pamiac sign-in link",
      html: `<p>Use this link to sign in to Pamiac. It expires in 5 minutes.</p><p><a href="${url}">Sign in</a></p>`,
    }),
  });
  if (!response.ok) {
    throw new Error("Could not send the magic link email");
  }
}
