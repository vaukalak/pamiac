import { createElement } from "react";
import { Heading, Section, Text } from "@react-email/components";
import { copyStyle, eyebrowStyle, titleStyle } from "../email-theme.ts";

interface Properties {
  eyebrow: string;
  title: string;
  body: string;
}

export function EmailIntro(props: Properties) {
  const { eyebrow, title, body } = props;

  return createElement(
    Section,
    null,
    createElement(Text, { style: eyebrowStyle }, eyebrow),
    createElement(Heading, { as: "h1", className: "email-title", style: titleStyle }, title),
    createElement(Text, { style: copyStyle }, body),
  );
}
