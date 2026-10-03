import { ConnectCopyAction } from "@/components/connect/connect-copy-action";
import { ConnectPromptText } from "@/components/connect/connect-prompt-text";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  onDone: () => void;
  secret: string;
}

export function ConnectTokenCreated(props: Properties) {
  const { onDone, secret } = props;

  return (
    <div className="token-secret">
      <h3>Your API token</h3>
      <Paragraph className="token-connect-emphasis">
        Copy this token now. You won&apos;t be able to see it again.
      </Paragraph>
      <ConnectPromptText text={secret} />
      <ConnectCopyAction className="library-lime" label="Copy token" text={secret} />
      <Button className="secondary" onClick={onDone} type="button">
        Done
      </Button>
    </div>
  );
}
