import { Button } from "@/ui/Button";

interface Properties {
  onClose: () => void;
  title: string;
  titleId: string;
}

export function TokenFormDialogHeading(props: Properties) {
  const { onClose, title, titleId } = props;

  return (
    <div className="share-dialog-head">
      <h2 id={titleId}>{title}</h2>
      <Button className="ghost small" onClick={onClose} type="button">
        Cancel
      </Button>
    </div>
  );
}
