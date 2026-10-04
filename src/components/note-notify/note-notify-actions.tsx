import { Button } from "@/ui/Button";

interface Properties {
  pending: boolean;
  onCancel: () => void;
}

export function NoteNotifyActions(props: Properties) {
  const { pending, onCancel } = props;

  return (
    <div className="note-notify-actions">
      <Button className="secondary" onClick={onCancel} type="button">
        Cancel
      </Button>
      <Button className="library-lime" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
