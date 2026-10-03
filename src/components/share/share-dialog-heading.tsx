import { Button } from "@/ui/Button";

interface Properties {
  onClose: () => void;
}

export function ShareDialogHeading(props: Properties) {
  const { onClose } = props;

  return (
    <div className="share-dialog-head">
      <h2 id="share-dialog-title">Share</h2>
      <Button className="ghost small" onClick={onClose} type="button">
        Close
      </Button>
    </div>
  );
}
