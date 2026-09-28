import type { UmlKind } from "@/lib/diagram";

interface Properties {
  kind: UmlKind;
  name: string;
  stereotype?: string;
}

export function NodeHeading(props: Properties) {
  const { kind, name, stereotype } = props;
  const shown = stereotype || kind === "interface";

  return (
    <header>
      {shown ? <span className="stereo">«{stereotype || kind}»</span> : null}
      <div className="name">{name}</div>
    </header>
  );
}
