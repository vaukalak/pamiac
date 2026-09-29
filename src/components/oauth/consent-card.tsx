import { ConsentActions } from "@/components/oauth/consent-actions";

interface Properties {
  clientLabel: string;
}

export function ConsentCard(props: Properties) {
  const { clientLabel } = props;

  return (
    <section className="auth-card">
      <p className="eyebrow">Connect</p>
      <h1>{clientLabel}</h1>
      <p>Connecting lets ChatGPT search, read, and edit this account&apos;s notes and diagrams.</p>
      <ConsentActions />
      <p className="hint">Deny does not grant access.</p>
    </section>
  );
}
