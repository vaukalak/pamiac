import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  detail: string;
  onOpen: () => void;
}

export function ConnectAdvancedEntry(props: Properties) {
  const { detail, onOpen } = props;

  return (
    <div className="token-connect-advanced-entry">
      <Button className="secondary" onClick={onOpen} type="button">
        Advanced options
      </Button>
      <Paragraph>{detail}</Paragraph>
    </div>
  );
}
