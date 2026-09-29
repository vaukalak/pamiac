import { CompartmentField } from "@/components/diagram/compartment-field";

interface Properties {
  attributes: string[];
  editable: boolean;
  methods: string[];
  onAttributes: (lines: string[]) => void;
  onMethods: (lines: string[]) => void;
}

export function InspectorCompartments(props: Properties) {
  const { attributes, editable, methods, onAttributes, onMethods } = props;

  return (
    <>
      <CompartmentField
        editable={editable}
        id="uml-attrs"
        label="Attributes"
        onChange={(value) => onAttributes(value.split("\n"))}
        value={attributes.join("\n")}
      />
      <CompartmentField
        editable={editable}
        id="uml-methods"
        label="Methods"
        onChange={(value) => onMethods(value.split("\n"))}
        value={methods.join("\n")}
      />
    </>
  );
}
