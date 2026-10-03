import { Button } from "@/ui/Button";

interface Properties {
  onBack?: () => void;
  onClose?: () => void;
}

export function ConnectHeadingBar(props: Properties) {
  const { onBack, onClose } = props;
  if (!onBack && !onClose) return null;

  return (
    <div className="share-dialog-head">
      {onBack ? (
        <Button className="ghost small" onClick={onBack} type="button">
          Back
        </Button>
      ) : (
        <span />
      )}
      {onClose ? (
        <Button className="ghost small" onClick={onClose} type="button">
          Close
        </Button>
      ) : null}
    </div>
  );
}
