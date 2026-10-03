import { createElement } from "react";
import { Section, Text } from "@react-email/components";
import { copyStyle, infoStyle } from "../email-theme.ts";

interface Properties {
  text: string;
}

export function EmailInfoBox(props: Properties) {
  const { text } = props;

  return createElement(
    Section,
    { style: infoStyle },
    createElement(Text, { style: { ...copyStyle, margin: "0" } }, text),
  );
}
