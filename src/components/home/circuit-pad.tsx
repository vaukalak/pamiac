import { padStyle, type CircuitPad as CircuitPadData } from "@/lib/home-circuit";

interface Properties {
  pad: CircuitPadData;
}

export function CircuitPad(props: Properties) {
  const { pad } = props;

  return (
    <g className="home-pad" style={padStyle(pad)}>
      <circle className="home-pad-halo" cx={pad.x} cy={pad.y} r={9} />
      <circle className="home-pad-dot" cx={pad.x} cy={pad.y} r={4} />
    </g>
  );
}
