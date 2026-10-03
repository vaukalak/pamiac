import { sharePalette } from "../components/share-preview/share-palette.ts";

/**
 * Solid colors taken from the site home tokens in globals.css and sharePalette.
 * Email clients do not receive CSS variables; these literals are the rendered values.
 * --home-panel is rgba(13, 17, 14, 0.82); the email surface is that color without alpha.
 */
export const emailTheme = {
  background: sharePalette.ground,
  surface: "#0d110e",
  surfaceRaised: "#121814",
  text: sharePalette.text,
  soft: sharePalette.soft,
  accent: sharePalette.lime,
  onAccent: sharePalette.onLime,
  border: "#31451c",
  divider: "#20281d",
  font: "Arial, Helvetica, sans-serif",
  width: "600px",
};

export const EXCERPT_LIMIT = 140;

export function truncateExcerpt(value: string) {
  const single = value.replace(/[\r\n]+/g, " ").trim();
  if (single.length <= EXCERPT_LIMIT) return single;
  return `${single.slice(0, EXCERPT_LIMIT - 1)}…`;
}

export const emailFont = {
  fontFamily: emailTheme.font,
};

export const bodyStyle = {
  ...emailFont,
  backgroundColor: emailTheme.background,
  color: emailTheme.text,
  margin: "0",
  padding: "32px 12px",
};

export const cardPadding = "32px";

export const cardStyle = {
  backgroundColor: emailTheme.surface,
  border: `1px solid ${emailTheme.border}`,
  borderRadius: "18px",
  boxSizing: "border-box" as const,
};

export const eyebrowStyle = {
  ...emailFont,
  color: emailTheme.accent,
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "1.5px",
  lineHeight: "16px",
  margin: "0 0 12px",
  textTransform: "uppercase" as const,
};

export const titleStyle = {
  ...emailFont,
  color: emailTheme.text,
  fontSize: "32px",
  fontWeight: "700",
  lineHeight: "36px",
  margin: "0 0 16px",
  wordBreak: "break-word" as const,
};

export const copyStyle = {
  ...emailFont,
  color: emailTheme.soft,
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 8px",
  wordBreak: "break-word" as const,
};

export const primaryButtonStyle = {
  ...emailFont,
  backgroundColor: emailTheme.accent,
  borderRadius: "12px",
  boxSizing: "border-box" as const,
  color: emailTheme.onAccent,
  fontSize: "16px",
  fontWeight: "700",
  lineHeight: "20px",
  padding: "16px 24px",
  textAlign: "center" as const,
  textDecoration: "none",
};

export const secondaryButtonStyle = {
  ...primaryButtonStyle,
  backgroundColor: emailTheme.surface,
  border: `1px solid ${emailTheme.border}`,
  color: emailTheme.text,
};

export const blockPadding = "16px";

export const infoStyle = {
  backgroundColor: emailTheme.surfaceRaised,
  border: `1px solid ${emailTheme.border}`,
  borderRadius: "12px",
  boxSizing: "border-box" as const,
  margin: "16px 0",
};

export const cardBlockStyle = {
  backgroundColor: emailTheme.surfaceRaised,
  border: `1px solid ${emailTheme.border}`,
  borderRadius: "12px",
  boxSizing: "border-box" as const,
  margin: "16px 0",
};

export const linkStyle = {
  ...emailFont,
  color: emailTheme.accent,
  fontSize: "14px",
  lineHeight: "20px",
  maxWidth: "100%",
  overflowWrap: "anywhere" as const,
  wordBreak: "break-all" as const,
  wordWrap: "break-word" as const,
};

export const footerStyle = {
  ...emailFont,
  color: emailTheme.soft,
  fontSize: "13px",
  lineHeight: "20px",
  margin: "12px 0 0",
};

export const wordmarkStyle = {
  ...emailFont,
  color: emailTheme.text,
  fontSize: "22px",
  fontWeight: "700",
  lineHeight: "28px",
  margin: "0",
};

export const headerMarkStyle = {
  ...emailFont,
  color: emailTheme.soft,
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1.2px",
  lineHeight: "16px",
  margin: "12px 0 0",
};
