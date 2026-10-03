import { TokenHeadingCopy } from "@/components/tokens/token-heading-copy";

interface Properties {
  spaceName: string;
}

export function TokenHeading(props: Properties) {
  const { spaceName } = props;

  return (
    <div className="library-heading">
      <TokenHeadingCopy spaceName={spaceName} />
    </div>
  );
}
