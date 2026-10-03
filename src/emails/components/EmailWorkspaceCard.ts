import { createElement } from "react";
import { Text } from "@react-email/components";
import {
  blockPadding,
  cardBlockStyle,
  copyStyle,
  emailTheme,
  eyebrowStyle,
} from "../email-theme.ts";
import { EmailInset } from "./EmailInset.ts";

interface Properties {
  name: string;
  description?: string;
}

export function EmailWorkspaceCard(props: Properties) {
  const { name, description } = props;

  return createElement(
    EmailInset,
    { padding: blockPadding, tableStyle: cardBlockStyle },
    createElement(Text, { style: { ...eyebrowStyle, margin: "0 0 8px" } }, "Workspace"),
    createElement(
      Text,
      { style: { ...copyStyle, color: emailTheme.text, fontWeight: "700", margin: "0" } },
      name,
    ),
    description
      ? createElement(Text, { style: { ...copyStyle, margin: "8px 0 0" } }, description)
      : null,
  );
}
