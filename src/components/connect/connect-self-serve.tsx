import { ConnectAgentLink } from "@/components/connect/connect-agent-link";
import type { ConnectPlatform } from "@/lib/connect-platforms";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  framed?: boolean;
  platform: ConnectPlatform;
}

export function ConnectSelfServe(props: Properties) {
  const { framed = false, platform } = props;

  return (
    <div className={framed ? "token-connect-self token-connect-self-framed" : "token-connect-self"}>
      {platform.showOr ? <Paragraph className="token-connect-or">OR</Paragraph> : null}
      <Paragraph>{platform.selfServe}</Paragraph>
      <Paragraph>{platform.selfServeHint}</Paragraph>
      <ConnectAgentLink />
    </div>
  );
}
