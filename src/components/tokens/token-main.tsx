import { TokenManager } from "@/components/tokens/token-manager";
import { Page } from "@/ui/Page";

interface Properties {
  spaceName: string;
}

export function TokenMain(props: Properties) {
  const { spaceName } = props;

  return (
    <Page className="library-main">
      <TokenManager spaceName={spaceName} />
    </Page>
  );
}
