import { Button } from "@/ui/Button";

interface Properties {
  onClose: () => void;
}

export function LibraryCreateFolderHeading(props: Properties) {
  const { onClose } = props;

  return (
    <div className="share-dialog-head">
      <h2 id="folder-create-title">New folder</h2>
      <Button className="ghost small" onClick={onClose} type="button">
        Cancel
      </Button>
    </div>
  );
}
