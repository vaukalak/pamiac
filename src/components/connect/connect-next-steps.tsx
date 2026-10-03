import { ConnectNextList } from "@/components/connect/connect-next-list";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  platformName: string;
}

export function ConnectNextSteps(props: Properties) {
  const { platformName } = props;

  return (
    <div className="token-connect-next">
      <Paragraph>What&apos;s next?</Paragraph>
      <ConnectNextList platformName={platformName} />
    </div>
  );
}
