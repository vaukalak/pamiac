import { TokenConnectOpener } from "@/components/tokens/token-connect-opener";
import { TokenHeading } from "@/components/tokens/token-heading";
import { TokenKeys } from "@/components/tokens/token-keys";

interface Properties {
  spaceName: string;
}

export function TokenManager(props: Properties) {
  const { spaceName } = props;

  return (
    <>
      <TokenHeading spaceName={spaceName} />
      <TokenConnectOpener />
      <TokenKeys />
    </>
  );
}
