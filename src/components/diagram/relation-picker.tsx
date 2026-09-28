import { UML_RELATIONS, type UmlRelationType } from "@/lib/diagram";
import { RelationOption } from "@/components/diagram/relation-option";

interface Properties {
  onRelation: (type: UmlRelationType) => void;
  relationType: UmlRelationType;
}

export function RelationPicker(props: Properties) {
  const { onRelation, relationType } = props;

  return (
    <div className="rel-picker">
      {UML_RELATIONS.map((type) => (
        <RelationOption
          active={relationType === type}
          key={type}
          onSelect={onRelation}
          type={type}
        />
      ))}
    </div>
  );
}
