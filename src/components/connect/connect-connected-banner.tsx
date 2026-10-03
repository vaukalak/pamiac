import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  platformName: string;
}

export function ConnectConnectedBanner(props: Properties) {
  const { platformName } = props;

  return (
    <div className="token-connect-connected-banner">
      <Paragraph>{`${platformName} connected`}</Paragraph>
      <Paragraph>{`${platformName} can now access your Pamiac library.`}</Paragraph>
    </div>
  );
}
