import { createElement } from "react";
import { Button } from "@react-email/components";
import { emailFont, primaryButtonStyle, secondaryButtonStyle } from "../email-theme.ts";

interface Properties {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
}

export function EmailButton(props: Properties) {
  const { href, label, tone = "primary" } = props;
  const face = tone === "secondary" ? secondaryButtonStyle : primaryButtonStyle;

  return createElement(
    "table",
    {
      align: "center",
      border: 0,
      cellPadding: 0,
      cellSpacing: 0,
      role: "presentation",
      style: {
        margin: "8px 0",
        maxWidth: "100%",
        tableLayout: "fixed",
        width: "100%",
      },
      width: "100%",
    },
    createElement(
      "tbody",
      null,
      createElement(
        "tr",
        null,
        createElement(
          "td",
          { align: "center", style: face },
          createElement(
            Button,
            {
              href,
              style: {
                ...emailFont,
                color: face.color,
                fontSize: face.fontSize,
                fontWeight: face.fontWeight,
                lineHeight: face.lineHeight,
                textDecoration: "none",
              },
            },
            label,
          ),
        ),
      ),
    ),
  );
}
