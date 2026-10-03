import Link from "next/link";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

export function PrivateFolderDenied() {
  return (
    <Section className="document-gate">
      <PageTitle title="This folder is private" />
      <Paragraph>Ask the owner to share it, or open a folder shared with you.</Paragraph>
      <Link className="btn secondary" href="/workspace">
        Back to your library
      </Link>
    </Section>
  );
}
