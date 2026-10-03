import { ConnectChooser } from "@/components/connect/connect-chooser";
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
      <div className="token-connect">
        <ConnectChooser />
      </div>
      <TokenKeys />
    </>
  );
}
