import Link from "next/link";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

interface Properties {
  id: string;
  nextPath?: string;
}

export function LockedSignIn(props: Properties) {
  const { id, nextPath } = props;
  const next = nextPath ?? `/d/${id}`;

  return (
    <Section className="document-gate">
      <PageTitle title="Sign in to view" />
      <Paragraph>This link is shared with specific email addresses.</Paragraph>
      <Link className="btn" href={`/login?next=${next}`}>
        Continue with email
      </Link>
    </Section>
  );
}
