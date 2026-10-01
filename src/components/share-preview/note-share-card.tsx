import { NoteShareLine } from "@/components/share-preview/note-share-line";
import { ShareCircuit } from "@/components/share-preview/share-circuit";
import { shareFont, sharePalette } from "@/components/share-preview/share-palette";
import { ShareWordmark } from "@/components/share-preview/share-wordmark";
import type { SharePreviewLine } from "@/lib/share-preview";

interface Properties {
  lines: SharePreviewLine[];
  title: string;
}

export function NoteShareCard(props: Properties) {
  const { lines, title } = props;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        background: sharePalette.ground,
        color: sharePalette.text,
        padding: "64px 76px",
        borderLeft: `6px solid ${sharePalette.lime}`,
        fontFamily: shareFont,
      }}
    >
      <ShareCircuit />
      <ShareWordmark size="label" />
      <div
        style={{
          display: "flex",
          marginTop: 28,
          color: sharePalette.text,
          fontFamily: shareFont,
          fontSize: 60,
          fontWeight: 600,
          lineHeight: 1.08,
          letterSpacing: "-0.04em",
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          width: 88,
          height: 6,
          marginTop: 24,
          background: sharePalette.lime,
        }}
      />
      {lines.map((line, index) => (
        <NoteShareLine key={`${line.kind}-${index}`} line={line} />
      ))}
    </div>
  );
}
