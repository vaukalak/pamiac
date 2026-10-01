import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  secret: string;
}

export function TokenSecret(props: Properties) {
  const { secret } = props;

  return (
    <div className="token-secret">
      <Paragraph>
        Copy this key now. Set PAMIAC_TOKEN to this value. Pamiac will not show it again.
      </Paragraph>
      <div className="secret">{secret}</div>
    </div>
  );
}
