import { CircuitTrace, type CircuitTraceKind } from "@/components/home/circuit-trace";
import { CIRCUIT_TRACES } from "@/lib/home-circuit";

interface Properties {
  kind: CircuitTraceKind;
}

export function CircuitLayer(props: Properties) {
  const { kind } = props;

  return (
    <g className={`home-board-${kind}`}>
      {CIRCUIT_TRACES.map((trace) => (
        <CircuitTrace key={trace.id} trace={trace} kind={kind} />
      ))}
    </g>
  );
}
