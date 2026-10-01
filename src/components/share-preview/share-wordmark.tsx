import { shareFont, sharePalette } from "@/components/share-preview/share-palette";

interface Properties {
  size: "display" | "label";
}

export function ShareWordmark(props: Properties) {
  const { size } = props;
  const display = size === "display";

  return (
    <div
      style={{
        display: "flex",
        color: display ? sharePalette.text : sharePalette.lime,
        fontFamily: shareFont,
        fontSize: display ? 92 : 28,
        fontWeight: 600,
        letterSpacing: "-0.04em",
        lineHeight: 1,
      }}
    >
      Pamiac
    </div>
  );
}
