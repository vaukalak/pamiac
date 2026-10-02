import { ConnectExpiredNotice } from "@/components/connect/connect-expired-notice";
import { ConnectHome } from "@/components/connect/connect-home";

interface Properties {
  email: string;
}

export function ConnectExpired(props: Properties) {
  const { email } = props;

  return (
    <ConnectHome email={email}>
      <ConnectExpiredNotice />
    </ConnectHome>
  );
}
