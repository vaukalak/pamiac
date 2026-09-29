import type { UmlKind, UmlRelationType } from "@/lib/diagram";
import { PALETTE_GROUPS } from "@/lib/diagram-palette";
import { PaletteGroup } from "@/components/diagram/palette-group";
import { RelationPicker } from "@/components/diagram/relation-picker";

interface Properties {
  editable: boolean;
  onAdd: (kind: UmlKind) => void;
  onArrange: () => void;
  onRelation: (type: UmlRelationType) => void;
  relationType: UmlRelationType;
}

export function DiagramPalette(props: Properties) {
  const { editable, onAdd, onArrange, onRelation, relationType } = props;

  return (
    <aside className="palette">
      {PALETTE_GROUPS.map((group) => (
        <PaletteGroup editable={editable} group={group} key={group.id} onAdd={onAdd} />
      ))}
      <h3>Relation</h3>
      <RelationPicker onRelation={onRelation} relationType={relationType} />
      {editable ? (
        <button onClick={onArrange} type="button">
          Arrange
        </button>
      ) : null}
    </aside>
  );
}
