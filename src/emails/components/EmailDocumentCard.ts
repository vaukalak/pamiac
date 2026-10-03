import { createElement } from "react";
import { Text } from "@react-email/components";
import {
  blockPadding,
  cardBlockStyle,
  copyStyle,
  emailTheme,
  eyebrowStyle,
  truncateExcerpt,
} from "../email-theme.ts";
import { EmailInset } from "./EmailInset.ts";

interface Properties {
  title: string;
  excerpt?: string;
  meta?: string;
}

export function EmailDocumentCard(props: Properties) {
  const { title, excerpt, meta } = props;
  const shortExcerpt = excerpt ? truncateExcerpt(excerpt) : "";

  return createElement(
    EmailInset,
    { padding: blockPadding, tableStyle: cardBlockStyle },
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
