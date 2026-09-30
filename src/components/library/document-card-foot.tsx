import type { BoardDocument } from "@/components/library/board-document";
import { editedLabel } from "@/lib/edited-label";
import type { Visibility } from "@/lib/access";

interface Properties {
  document: BoardDocument;
}

const VISIBILITY_LABEL: Record<Visibility, string> = {
  private: "Only me",
  emails: "Email",
  password: "Password",
  public: "Public",
};

export function DocumentCardFoot(props: Properties) {
  const { document } = props;

  return (
    <div className="doc-card-foot">
      <p className="doc-edited">Edited {editedLabel(document.updatedAt)}</p>
      <span className="badge">{VISIBILITY_LABEL[document.visibility]}</span>
    </div>
  );
}
