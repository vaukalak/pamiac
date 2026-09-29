import type { UmlRelationType } from "@/lib/diagram";

interface Properties {
  active: boolean;
  onSelect: (type: UmlRelationType) => void;
  type: UmlRelationType;
}

export function RelationOption(props: Properties) {
  const { active, onSelect, type } = props;

  return (
    <button className={active ? "active" : ""} onClick={() => onSelect(type)} type="button">
      {type}
    </button>
  );
}
