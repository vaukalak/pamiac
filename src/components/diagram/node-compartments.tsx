import { CompartmentList } from "@/components/diagram/compartment-list";

interface Properties {
  attributes: string[];
  methods: string[];
}

export function NodeCompartments(props: Properties) {
  const { attributes, methods } = props;

  return (
    <>
      <CompartmentList lines={attributes} />
      <CompartmentList lines={methods} />
    </>
  );
}
