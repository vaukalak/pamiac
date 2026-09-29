import type { KeyboardEvent } from "react";
import type { UmlKind } from "@/lib/diagram";
import type { PaletteGroupDefinition } from "@/lib/diagram-palette";
import { PaletteItem } from "@/components/diagram/palette-item";

function stopPaletteSpace(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== " " && event.code !== "Space") return;
  event.stopPropagation();
}

interface Properties {
  editable: boolean;
  group: PaletteGroupDefinition;
  onAdd: (kind: UmlKind) => void;
}

export function PaletteGroup(props: Properties) {
  const { editable, group, onAdd } = props;

  return (
    <details className="palette-group" {...(group.open ? { open: true } : {})}>
      <summary onKeyDown={stopPaletteSpace}>{group.label}</summary>
      {group.kinds.map((item) => (
        <PaletteItem
          editable={editable}
          key={item.id}
          kind={item.id}
          label={item.label}
          onAdd={onAdd}
        />
      ))}
    </details>
  );
}
