"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { WorkspaceSwitcherMenu } from "@/components/library/workspace-switcher-menu";
import { WorkspaceSwitcherTrigger } from "@/components/library/workspace-switcher-trigger";
import { librarySpaces, type NamedWorkspace } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";

interface Properties {
  initialWorkspaces: NamedWorkspace[];
  onAdd: () => void;
  onSelect: (workspaceId: string) => void;
  selectedId: string;
}

export function WorkspaceSelector(props: Properties) {
  const { initialWorkspaces, onAdd, onSelect, selectedId } = props;
  const spacesQuery = useQuery({
    ...workspacesQueryOptions(),
    initialData: initialWorkspaces,
  });
  const spaces = librarySpaces(spacesQuery.data);
  const current = spaces.find((space) => space.id === selectedId) ?? spaces[0];
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointer(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
    }

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    setOpen((value) => !value);
  }

  function choose(workspaceId: string) {
    setOpen(false);
    onSelect(workspaceId);
  }

  function add() {
    setOpen(false);
    onAdd();
  }

  return (
    <div aria-label="Workspace" className="workspace-selector" ref={rootRef} role="group">
      <WorkspaceSwitcherTrigger
        controls={menuId}
        label={current?.label ?? "Workspace"}
        onToggle={toggle}
        open={open}
      />
      {open ? (
        <WorkspaceSwitcherMenu
          id={menuId}
          onAdd={add}
          onSelect={choose}
          selectedId={selectedId}
          spaces={spaces}
        />
      ) : null}
    </div>
  );
}
