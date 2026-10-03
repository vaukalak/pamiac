import { createElement } from "react";
import { Section, Text } from "@react-email/components";
import { headerMarkStyle } from "../email-theme.ts";
import { EmailBrand } from "./EmailBrand.ts";

export function EmailHeader() {
  return createElement(
    Section,
    { style: { margin: "0 0 28px" } },
    createElement(EmailBrand),
    createElement(Text, { style: headerMarkStyle }, "NOTES. DIAGRAMS. AGENTS."),
  );
}
