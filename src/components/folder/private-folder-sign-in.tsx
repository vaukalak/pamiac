import Link from "next/link";
import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

interface Properties {
  id: string;
}

export function PrivateFolderSignIn(props: Properties) {
  const { id } = props;

  return (
    <Section className="document-gate">
      <PageTitle title="Login to view private folder" />
      <Paragraph>This folder is private.</Paragraph>
      <Link className="btn" href={`/login?next=/f/${id}`}>
        Continue with email
      </Link>
    </Section>
  );
}
