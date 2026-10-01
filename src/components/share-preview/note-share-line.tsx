import type { SharePreviewLine } from "@/lib/share-preview";
import { shareFont, sharePalette } from "@/components/share-preview/share-palette";

interface Properties {
  line: SharePreviewLine;
}

export function NoteShareLine(props: Properties) {
  const { line } = props;
  const heading = line.kind === "heading";

  return (
    <div
      style={{
        display: "flex",
        marginTop: heading ? 18 : 10,
        color: heading ? sharePalette.text : sharePalette.soft,
        fontFamily: shareFont,
        fontSize: heading ? headingSize(line.level) : 28,
        fontWeight: heading ? 600 : 400,
        lineHeight: heading ? 1.15 : 1.35,
        letterSpacing: heading ? "-0.03em" : "-0.01em",
      }}
    >
      {line.text}
    </div>
  );
}

function headingSize(level: number) {
  if (level <= 1) return 40;
  if (level === 2) return 34;
  return 30;
}
