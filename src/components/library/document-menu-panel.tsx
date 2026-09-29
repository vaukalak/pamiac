import type { BoardChange, BoardDocument } from "@/components/library/board-document";
import { DocumentDelete } from "@/components/library/document-delete";
import { DocumentMenuActions } from "@/components/library/document-menu-actions";
import { DocumentRename } from "@/components/library/document-rename";

interface Properties {
  id: string;
  item: BoardDocument;
  mode: "actions" | "rename" | "delete";
  onChange: (change: BoardChange) => void;
  onClose: () => void;
  onMode: (mode: "actions" | "rename" | "delete") => void;
  onShare: () => void;
}

export function DocumentMenuPanel(props: Properties) {
  const { id, item, mode, onChange, onClose, onMode, onShare } = props;

  return (
    <div className="menu-panel" id={id} onClick={(event) => event.stopPropagation()} role="menu">
      {mode === "rename" ? (
        <DocumentRename
          id={item.id}
          onCancel={() => onMode("actions")}
          onRenamed={(title) => {
            onChange({ kind: "rename", id: item.id, title });
            onClose();
          }}
          title={item.title}
        />
      ) : null}
      {mode === "delete" ? (
        <DocumentDelete
          id={item.id}
          onCancel={() => onMode("actions")}
          onDeleted={() => onChange({ kind: "delete", id: item.id })}
        />
      ) : null}
      {mode === "actions" ? (
        <DocumentMenuActions
          onDelete={() => onMode("delete")}
          onRename={() => onMode("rename")}
          onShare={onShare}
        />
      ) : null}
    </div>
  );
}
