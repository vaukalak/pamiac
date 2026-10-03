import { createElement } from "react";
import { Text } from "@react-email/components";
import { blockPadding, copyStyle, infoStyle } from "../email-theme.ts";
import { EmailInset } from "./EmailInset.ts";

interface Properties {
  text: string;
}

export function EmailInfoBox(props: Properties) {
  const { text } = props;

  return createElement(
    EmailInset,
    { padding: blockPadding, tableStyle: infoStyle },
    createElement(Text, { style: { ...copyStyle, margin: "0" } }, text),
  );
}
