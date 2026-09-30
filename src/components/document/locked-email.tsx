import Link from "next/link";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

export function LockedEmail() {
  return (
    <Section className="document-gate">
      <PageTitle title="This account does not have access" />
      <Paragraph>
        Ask the owner to add your email, or open the link while signed in as an invited person.
      </Paragraph>
      <Link className="btn secondary" href="/workspace">
        Back to your library
      </Link>
    </Section>
  );
}
