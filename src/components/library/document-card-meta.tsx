import type { BoardDocument } from "@/components/library/board-document";
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

export function DocumentCardMeta(props: Properties) {
  const { document } = props;

  return (
    <div className="meta">
      <span>{document.type === "note" ? "Note" : "UML"}</span>
      <span className="badge">{VISIBILITY_LABEL[document.visibility]}</span>
    </div>
  );
}
