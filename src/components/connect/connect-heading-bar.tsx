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
        <Button className="ghost small token-connect-close" onClick={onClose} type="button">
          <svg aria-hidden="true" viewBox="0 0 16 16">
            <path d="M4 4 12 12M12 4 4 12" />
          </svg>
          <span className="token-connect-sr">Close</span>
        </Button>
      ) : null}
    </div>
  );
}
