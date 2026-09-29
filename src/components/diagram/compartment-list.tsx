import { CompartmentLine } from "@/components/diagram/compartment-line";

interface Properties {
  lines: string[];
}

export function CompartmentList(props: Properties) {
  const { lines } = props;
  if (lines.length === 0) {
    return (
      <ul>
        <li>&nbsp;</li>
      </ul>
    );
  }

  return (
    <ul>
      {lines.map((line) => (
        <CompartmentLine key={line} line={line} />
      ))}
    </ul>
  );
}
