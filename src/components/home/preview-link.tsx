export interface PreviewGraphLink {
  id: string;
  d: string;
  dot: { x: number; y: number };
  duration: number;
  delay: number;
}

interface Properties {
  link: PreviewGraphLink;
}

export function PreviewLink(props: Properties) {
  const { link } = props;

  return (
    <g>
      <path className="home-preview-link" d={link.d} />
      <path
        className="home-trace-pulse"
        d={link.d}
        pathLength={1}
        style={{ animationDuration: `${link.duration}s`, animationDelay: `${link.delay}s` }}
      />
      <circle className="home-preview-dot" cx={link.dot.x} cy={link.dot.y} r={2.5} />
    </g>
  );
}
