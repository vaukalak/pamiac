import { createElement } from "react";
import { Hr, Section, Text } from "@react-email/components";
import { emailTheme, footerStyle } from "../email-theme.ts";

export function EmailFooter() {
  return createElement(
    Section,
    { style: { marginTop: "24px" } },
    createElement(Hr, {
      style: {
        borderColor: emailTheme.divider,
        borderTop: `1px solid ${emailTheme.divider}`,
        margin: "0",
      },
    }),
    createElement(Text, { style: footerStyle }, "Pamiac · A shared mind for you and your agents."),
  );
}
