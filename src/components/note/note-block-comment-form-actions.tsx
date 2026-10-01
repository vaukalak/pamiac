import { Button } from "@/ui/Button";

interface Properties {
  onCancel: () => void;
}

export function NoteBlockCommentFormActions(props: Properties) {
  const { onCancel } = props;

  return (
    <div className="row-actions">
      <Button className="small" type="submit">
        Save
      </Button>
      <Button className="ghost small" onClick={onCancel} type="button">
        Cancel
      </Button>
    </div>
  );
}
