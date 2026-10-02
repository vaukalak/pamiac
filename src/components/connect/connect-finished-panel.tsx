import { ConnectReturned } from "@/components/connect/connect-returned";
import { Section } from "@/ui/Section";

interface Properties {
  agentName: string;
}

export function ConnectFinishedPanel(props: Properties) {
  const { agentName } = props;

  return (
    <Section className="home-sign-in-panel">
      <ConnectReturned agentName={agentName} />
    </Section>
  );
}
