import type { CircuitChip as CircuitChipData } from "@/lib/home-circuit";

interface Properties {
  chip: CircuitChipData;
}

export function CircuitChip(props: Properties) {
  const { chip } = props;

  return <rect className="home-chip" x={chip.x} y={chip.y} width={18} height={10} rx={1.5} />;
}
