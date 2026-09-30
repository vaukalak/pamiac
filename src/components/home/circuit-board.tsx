import { CircuitChip } from "@/components/home/circuit-chip";
import { CircuitLayer } from "@/components/home/circuit-layer";
import { CircuitPad } from "@/components/home/circuit-pad";
import { CIRCUIT_CHIPS, CIRCUIT_PADS, CIRCUIT_VIEWBOX } from "@/lib/home-circuit";

export function CircuitBoard() {
  return (
    <svg
      className="home-board"
      viewBox={`0 0 ${CIRCUIT_VIEWBOX.width} ${CIRCUIT_VIEWBOX.height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <CircuitLayer kind="base" />
      {CIRCUIT_CHIPS.map((chip) => (
        <CircuitChip key={chip.id} chip={chip} />
      ))}
      <CircuitLayer kind="glow" />
      <CircuitLayer kind="pulse" />
      {CIRCUIT_PADS.map((pad) => (
        <CircuitPad key={pad.id} pad={pad} />
      ))}
    </svg>
  );
}
