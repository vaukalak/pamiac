import { ConnectFinishedPanel } from "@/components/connect/connect-finished-panel";
import { ConnectHome } from "@/components/connect/connect-home";

interface Properties {
  agentName: string;
  email: string;
}

export function ConnectFinished(props: Properties) {
  const { agentName, email } = props;

  return (
    <ConnectHome email={email}>
      <ConnectFinishedPanel agentName={agentName} />
    </ConnectHome>
  );
}
