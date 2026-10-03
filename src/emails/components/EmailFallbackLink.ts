import { createElement } from "react";
import { Link, Section, Text } from "@react-email/components";
import { copyStyle, linkStyle } from "../email-theme.ts";

interface Properties {
  href: string;
}

export function EmailFallbackLink(props: Properties) {
  const { href } = props;

  return createElement(
    Section,
    { style: { margin: "8px 0 16px" } },
    createElement(
      Text,
      { style: copyStyle },
      "If the button doesn’t work, copy and paste this link into your browser:",
    ),
    createElement(Link, { href, style: linkStyle }, href),
  );
}
