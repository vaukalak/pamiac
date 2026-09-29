import type { UmlKind } from "@/lib/diagram";

interface Properties {
  editable: boolean;
  kind: UmlKind;
  label: string;
  onAdd: (kind: UmlKind) => void;
}

export function PaletteItem(props: Properties) {
  const { editable, kind, label, onAdd } = props;

  return (
    <button
      draggable={editable}
      onClick={() => {
        if (!editable) return;
        onAdd(kind);
      }}
      onDragStart={(event) => {
        if (!editable) return;
        event.dataTransfer.setData("application/pamiac-uml", kind);
        event.dataTransfer.effectAllowed = "move";
      }}
      type="button"
    >
      {label}
    </button>
  );
}
