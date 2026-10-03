import { createElement } from "react";
import { Section, Text } from "@react-email/components";
import {
  cardBlockStyle,
  copyStyle,
  emailTheme,
  eyebrowStyle,
  truncateExcerpt,
} from "../email-theme.ts";

interface Properties {
  title: string;
  excerpt?: string;
  meta?: string;
}

export function EmailDocumentCard(props: Properties) {
  const { title, excerpt, meta } = props;
  const shortExcerpt = excerpt ? truncateExcerpt(excerpt) : "";

  return createElement(
    Section,
    { style: cardBlockStyle },
    createElement(Text, { style: { ...eyebrowStyle, margin: "0 0 8px" } }, "Note"),
    createElement(
      Text,
      { style: { ...copyStyle, color: emailTheme.text, fontWeight: "700", margin: "0" } },
      title,
    ),
    shortExcerpt
      ? createElement(Text, { style: { ...copyStyle, margin: "8px 0 0" } }, shortExcerpt)
      : null,
    meta ? createElement(Text, { style: { ...copyStyle, margin: "8px 0 0" } }, meta) : null,
  );
}
