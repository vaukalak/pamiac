import Link from "next/link";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

interface Properties {
  id: string;
  type: "note" | "diagram";
}

export function PrivateSignIn(props: Properties) {
  const { id, type } = props;
  const title = type === "diagram" ? "Login to view private diagram" : "Login to view private note";

  return (
    <Section className="document-gate">
      <PageTitle title={title} />
      <Paragraph>This document is private.</Paragraph>
      <Link className="btn" href={`/login?next=/d/${id}`}>
        Continue with email
      </Link>
    </Section>
  );
}
