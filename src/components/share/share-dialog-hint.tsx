import { Paragraph } from "@/ui/Paragraph";

export function ShareDialogHint() {
  return (
    <div className="share-dialog-hint" id="share-dialog-hint">
      <Paragraph>Control who can open this document.</Paragraph>
      <Paragraph>Only you can edit.</Paragraph>
    </div>
  );
}
