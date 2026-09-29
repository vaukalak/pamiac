import { WorkspaceCreate } from "@/components/library/workspace-create";
import { WorkspaceSelector } from "@/components/library/workspace-selector";
import type { NamedWorkspace } from "@/lib/library-spaces";

interface Properties {
  onSelect: (workspaceId: string) => void;
  selectedId: string;
  workspaces: NamedWorkspace[];
}

export function LibrarySidebar(props: Properties) {
  const { onSelect, selectedId, workspaces } = props;

  return (
    <aside className="library-sidebar">
      <WorkspaceSelector
        initialWorkspaces={workspaces}
        onSelect={onSelect}
        selectedId={selectedId}
      />
      <details className="library-space-add">
        <summary>
          <span aria-hidden="true" className="library-space-plus">
            +
          </span>
          Add workspace
        </summary>
        <WorkspaceCreate onCreated={onSelect} />
      </details>
    </aside>
  );
}
