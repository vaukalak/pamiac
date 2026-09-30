import { Button } from "@/ui/Button";

interface Properties {
  onClose: () => void;
  titleId: string;
}

export function ConnectionDialogHeading(props: Properties) {
  const { onClose, titleId } = props;

  return (
    <div className="share-dialog-head">
      <h2 id={titleId}>New connection</h2>
      <Button className="ghost small" onClick={onClose} type="button">
        Done
      </Button>
    </div>
  );
}
