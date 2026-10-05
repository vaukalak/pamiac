"use client";

import { useForm } from "react-hook-form";
import { WorkspaceSwitcherOption } from "@/components/library/workspace-switcher-option";
import {
  WorkspaceSwitcherSearch,
  type WorkspaceSwitcherSearchValues,
} from "@/components/library/workspace-switcher-search";
import type { LibrarySpace } from "@/lib/library-spaces";
import { Button } from "@/ui/Button";

const SEARCH_AT = 8;

interface Properties {
  id: string;
  onAdd: () => void;
  onSelect: (workspaceId: string) => void;
  selectedId: string;
  spaces: LibrarySpace[];
}

function visibleSpaces(spaces: readonly LibrarySpace[], query: string) {
  const needle = query.trim().toLocaleLowerCase("en");
  if (!needle) return spaces;
  return spaces.filter((space) => space.label.toLocaleLowerCase("en").includes(needle));
}

export function WorkspaceSwitcherMenu(props: Properties) {
  const { id, onAdd, onSelect, selectedId, spaces } = props;
  const form = useForm<WorkspaceSwitcherSearchValues>({
    defaultValues: { query: "" },
  });
  const query = form.watch("query") ?? "";
  const many = spaces.length >= SEARCH_AT;
  const visible = many ? visibleSpaces(spaces, query) : spaces;

  return (
    <div className="workspace-switcher-menu" id={id} role="listbox">
      {many ? <WorkspaceSwitcherSearch form={form} /> : null}
      {visible.map((space) => (
        <WorkspaceSwitcherOption
          current={selectedId === space.id}
          key={space.id}
          label={space.label}
          onSelect={() => onSelect(space.id)}
        />
      ))}
      {visible.length === 0 ? (
        <p className="workspace-switcher-empty">No matching workspaces</p>
      ) : null}
      <Button className="ghost workspace-switcher-add" onClick={onAdd} type="button">
        + Add workspace
      </Button>
    </div>
  );
}
