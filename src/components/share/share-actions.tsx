import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  error: string;
  message: string;
  pending: boolean;
  saveClassName?: string;
  onSave: () => void;
}

export function ShareActions(props: Properties) {
  const { error, message, pending, saveClassName, onSave } = props;

  return (
    <div className="share-actions">
      <Button className={saveClassName} disabled={pending} onClick={onSave} type="button">
        {pending ? "Saving…" : "Save sharing"}
      </Button>
      {message ? <Paragraph className="hint">{message}</Paragraph> : null}
      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}
