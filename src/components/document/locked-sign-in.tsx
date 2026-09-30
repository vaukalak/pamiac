import Link from "next/link";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

interface Properties {
  id: string;
}

export function LockedSignIn(props: Properties) {
  const { id } = props;

  return (
    <Section className="document-gate">
      <PageTitle title="Sign in to view" />
      <Paragraph>This document is shared with specific email addresses.</Paragraph>
      <Link className="btn" href={`/login?next=/d/${id}`}>
        Continue with email
      </Link>
    </Section>
  );
}
