import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  error: string;
  message: string;
  pending: boolean;
}

export function ShareActions(props: Properties) {
  const { error, message, pending } = props;

  return (
    <div className="share-actions">
      <Button className="library-lime" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save sharing"}
      </Button>
      {message ? <Paragraph className="hint">{message}</Paragraph> : null}
      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}
