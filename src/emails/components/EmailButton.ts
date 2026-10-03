import { createElement } from "react";
import { Button, Section } from "@react-email/components";
import { primaryButtonStyle, secondaryButtonStyle } from "../email-theme.ts";

interface Properties {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
}

export function EmailButton(props: Properties) {
  const { href, label, tone = "primary" } = props;
  const style = tone === "secondary" ? secondaryButtonStyle : primaryButtonStyle;

  return createElement(
    Section,
    { style: { margin: "8px 0" } },
    createElement(Button, { href, style }, label),
  );
}
