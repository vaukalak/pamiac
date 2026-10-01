"use client";

import type { MouseEvent, RefObject } from "react";
import { useState } from "react";
import { LibraryBrand } from "@/components/library/library-brand";
import { LibraryMenuClose } from "@/components/library/library-menu-close";
import { LibraryNav } from "@/components/library/library-nav";
import { LibraryRailLinks } from "@/components/library/library-rail-links";
import { LibrarySpaceAddButton } from "@/components/library/library-space-add-button";
import { LibrarySpaceAddDialog } from "@/components/library/library-space-add-dialog";
import type { LibraryPage } from "@/components/library/library-sidebar";
import { LibraryWorkspaceNav } from "@/components/library/library-workspace-nav";
import { WorkspaceCreate } from "@/components/library/workspace-create";
import { WorkspaceSelector } from "@/components/library/workspace-selector";
import type { LibraryFilter } from "@/components/library/board-document";
import type { NamedWorkspace } from "@/lib/library-spaces";

interface Properties {
  filter: LibraryFilter;
  menuId: string;
  mobile: boolean;
  onClose: () => void;
  onFilter: (filter: LibraryFilter) => void;
  onSelect: (workspaceId: string) => void;
  open: boolean;
  page: LibraryPage;
  panelRef: RefObject<HTMLElement | null>;
  selectedId: string;
  workspaces: NamedWorkspace[];
}

export function LibrarySidebarPanel(props: Properties) {
  const {
    filter,
    menuId,
    mobile,
    onClose,
    onFilter,
    onSelect: selectWorkspace,
    open,
    page,
    panelRef,
    selectedId,
    workspaces,
  } = props;
  const [creating, setCreating] = useState(false);
  const dialog = mobile && open;

  function close() {
    setCreating(false);
  }

  function onSelect(workspaceId: string) {
    close();
    selectWorkspace(workspaceId);
  }

  function openCreate() {
    setCreating(true);
  }

  function onNavigate(event: MouseEvent<HTMLElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest("a[href]")) return;
    onClose();
  }

  const workspaceForm = <WorkspaceCreate onCreated={onSelect} />;

  return (
    <aside
      aria-hidden={mobile && !open ? true : undefined}
      aria-label={dialog ? "Library menu" : undefined}
      aria-modal={dialog ? true : undefined}
      className={open ? "library-sidebar is-open" : "library-sidebar"}
      id={menuId}
      inert={mobile && !open ? true : undefined}
      onClick={onNavigate}
      ref={panelRef}
      role={dialog ? "dialog" : undefined}
      tabIndex={dialog ? -1 : undefined}
    >
      <LibraryMenuClose onClose={onClose} />
      <LibraryBrand />
      <p className="library-rail-label">Workspace</p>
      <WorkspaceSelector
        initialWorkspaces={workspaces}
        onSelect={selectWorkspace}
        selectedId={selectedId}
      />
      <LibrarySpaceAddButton expanded={creating} label="Add workspace" onOpen={openCreate} />
      {creating ? <LibrarySpaceAddDialog form={workspaceForm} onClose={close} /> : null}
      <p className="library-rail-label">Library</p>
      <LibraryNav filter={filter} linked={page !== "library"} onFilter={onFilter} />
      <LibraryWorkspaceNav page={page} />
      <LibraryRailLinks />
    </aside>
  );
}
