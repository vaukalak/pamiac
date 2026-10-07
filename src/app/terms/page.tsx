import type { Metadata } from "next";
import { PublicNote } from "@/components/public-note/public-note";
import { termsNote } from "@/lib/public-notes";
import { getLibrarySession } from "@/lib/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using Pamiac notes, UML diagrams, sharing, and the ChatGPT plugin.",
};

export default async function TermsPage() {
  const result = await getLibrarySession();
  const email = result.status === "ok" ? (result.session?.user.email ?? null) : null;

  return (
    <PublicNote
      email={email}
      id={termsNote.id}
      markdown={termsNote.markdown}
      title={termsNote.title}
    />
  );
}
