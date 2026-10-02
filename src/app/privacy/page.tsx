import type { Metadata } from "next";
import { PublicNote } from "@/components/public-note/public-note";
import { privacyNote } from "@/lib/public-notes";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Pamiac handles your account, notes, diagrams, and the ChatGPT plugin.",
};

export default function PrivacyPage() {
  return (
    <PublicNote id={privacyNote.id} markdown={privacyNote.markdown} title={privacyNote.title} />
  );
}
