import type { Metadata } from "next";
import { PublicNote } from "@/components/public-note/public-note";
import { privacyNote } from "@/lib/public-notes";
import { getLibrarySession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Pamiac handles your account, notes, diagrams, and the ChatGPT plugin.",
};

export default async function PrivacyPage() {
  const result = await getLibrarySession();
  const email = result.status === "ok" ? (result.session?.user.email ?? null) : null;

  return (
    <PublicNote
      email={email}
      id={privacyNote.id}
      markdown={privacyNote.markdown}
      title={privacyNote.title}
    />
  );
}
