import { ConnectHome } from "@/components/connect/connect-home";
import { ConnectReturnOffer } from "@/components/connect/connect-return-offer";

interface Properties {
  agentName: string;
  connectId: string;
  email: string;
}

export function ConnectReturn(props: Properties) {
  const { agentName, connectId, email } = props;

  return (
    <ConnectHome email={email}>
      <ConnectReturnOffer agentName={agentName} connectId={connectId} />
    </ConnectHome>
  );
}
