import { PageTitle } from "@/ui/PageTitle";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  agentName: string;
}

export function ConnectReturned(props: Properties) {
  const { agentName } = props;

  return (
    <>
      <PageTitle title={agentName} />
      <Paragraph>The agent can continue.</Paragraph>
    </>
  );
}
