import { traceStyle, type CircuitTrace as CircuitTraceData } from "@/lib/home-circuit";

export type CircuitTraceKind = "base" | "glow" | "pulse";

interface Properties {
  trace: CircuitTraceData;
  kind: CircuitTraceKind;
}

export function CircuitTrace(props: Properties) {
  const { trace, kind } = props;

  if (kind === "base") {
    return <path className="home-trace-base" d={trace.d} />;
  }

  return (
    <path className={`home-trace-${kind}`} d={trace.d} pathLength={1} style={traceStyle(trace)} />
  );
}
