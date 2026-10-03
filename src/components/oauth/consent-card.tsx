import { ConsentActions } from "@/components/oauth/consent-actions";
import { ConsentCapabilities } from "@/components/oauth/consent-capabilities";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  clientLabel: string;
}

export function ConsentCard(props: Properties) {
  const { clientLabel } = props;

  return (
    <section className="auth-card token-connect connect-consent">
      <h1>{`Connect ${clientLabel} to Pamiac`}</h1>
      <Paragraph>{`${clientLabel} wants to access your Pamiac documents.`}</Paragraph>
      <ConsentCapabilities />
      <ConsentActions />
      <Paragraph className="hint">Deny does not grant access.</Paragraph>
    </section>
  );
}
