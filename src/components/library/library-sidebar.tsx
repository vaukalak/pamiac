"use client";

import { LibraryBrand } from "@/components/library/library-brand";
import { LibraryNav } from "@/components/library/library-nav";
import { LibraryRailLinks } from "@/components/library/library-rail-links";
import { LibrarySpaceAddButton } from "@/components/library/library-space-add-button";
import { LibrarySpaceAddDialog } from "@/components/library/library-space-add-dialog";
import { LibraryWorkspaceNav } from "@/components/library/library-workspace-nav";
import { WorkspaceCreate } from "@/components/library/workspace-create";
import { WorkspaceSelector } from "@/components/library/workspace-selector";
import type { LibraryFilter } from "@/components/library/board-document";
import type { NamedWorkspace } from "@/lib/library-spaces";
import { useState } from "react";

export type LibraryPage = "library" | "settings" | "members" | "document";

interface Properties {
  filter: LibraryFilter;
  onFilter: (filter: LibraryFilter) => void;
  onSelect: (workspaceId: string) => void;
  page: LibraryPage;
  selectedId: string;
  workspaces: NamedWorkspace[];
}

export function LibrarySidebar(props: Properties) {
  const { filter, onFilter, onSelect: selectWorkspace, page, selectedId, workspaces } = props;
  const [creating, setCreating] = useState(false);

  function close() {
    setCreating(false);
  }

  function onSelect(workspaceId: string) {
    close();
    selectWorkspace(workspaceId);
  }

  function open() {
    setCreating(true);
  }

  const workspaceForm = <WorkspaceCreate onCreated={onSelect} />;

  return (
    <aside className="library-sidebar">
      <LibraryBrand />
      <p className="library-rail-label">Workspace</p>
      <WorkspaceSelector
        initialWorkspaces={workspaces}
        onSelect={selectWorkspace}
        selectedId={selectedId}
      />
      <LibrarySpaceAddButton expanded={creating} label="Add workspace" onOpen={open} />
      {creating ? <LibrarySpaceAddDialog form={workspaceForm} onClose={close} /> : null}
      <p className="library-rail-label">Library</p>
      <LibraryNav filter={filter} linked={page !== "library"} onFilter={onFilter} />
      <LibraryWorkspaceNav page={page} />
      <LibraryRailLinks />
    </aside>
  );
}
