import { ShareWordmark } from "@/components/share-preview/share-wordmark";
import { shareFont, sharePalette } from "@/components/share-preview/share-palette";
import { SHARE_APP_DESCRIPTION } from "@/lib/share-preview";

export function ShareCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: sharePalette.paper,
        color: sharePalette.ink,
        padding: "72px 80px",
        borderLeft: `20px solid ${sharePalette.teal}`,
        fontFamily: shareFont,
      }}
    >
      <ShareWordmark size="display" />
      <div
        style={{
          display: "flex",
          width: 88,
          height: 6,
          marginTop: 28,
          background: sharePalette.teal,
        }}
      />
      <div
        style={{
          display: "flex",
          maxWidth: 920,
          marginTop: 28,
          color: sharePalette.inkSoft,
          fontFamily: shareFont,
          fontSize: 34,
          fontWeight: 400,
          lineHeight: 1.35,
          letterSpacing: "-0.02em",
        }}
      >
        {SHARE_APP_DESCRIPTION}
      </div>
    </div>
  );
}
