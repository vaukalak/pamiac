import { TokenHeadingCopy } from "@/components/tokens/token-heading-copy";
import { TokenNewConnection } from "@/components/tokens/token-new-connection";

interface Properties {
  spaceName: string;
}

export function TokenHeading(props: Properties) {
  const { spaceName } = props;

  return (
    <div className="library-heading">
      <TokenHeadingCopy spaceName={spaceName} />
      <TokenNewConnection />
    </div>
  );
}
