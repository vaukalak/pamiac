import type { Metadata } from "next";
import { PublicNote } from "@/components/public-note/public-note";
import { termsNote } from "@/lib/public-notes";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using Pamiac notes, UML diagrams, sharing, and the ChatGPT plugin.",
};

export default function TermsPage() {
  return <PublicNote id={termsNote.id} markdown={termsNote.markdown} title={termsNote.title} />;
}
