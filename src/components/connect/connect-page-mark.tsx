import { ConnectPlatformMark } from "@/components/connect/connect-platform-mark";
import { PageTitle } from "@/ui/PageTitle";

interface Properties {
  subtitle: string;
}

export function ConnectPageMark(props: Properties) {
  const { subtitle } = props;

  return (
    <div className="token-connect-page-head">
      <ConnectPlatformMark id="pamiac" />
      <PageTitle subtitle={subtitle} title="Connect Pamiac" />
    </div>
  );
}
