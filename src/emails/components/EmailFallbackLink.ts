import { createElement } from "react";
import { Link, Text } from "@react-email/components";
import { copyStyle, linkStyle } from "../email-theme.ts";

interface Properties {
  href: string;
}

const cellStyle = {
  maxWidth: "100%",
  overflowWrap: "anywhere" as const,
  wordBreak: "break-all" as const,
  wordWrap: "break-word" as const,
};

export function EmailFallbackLink(props: Properties) {
  const { href } = props;

  return createElement(
    "table",
    {
      align: "center",
      border: 0,
      cellPadding: 0,
      cellSpacing: 0,
      role: "presentation",
      style: {
        margin: "8px 0 16px",
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
          { style: cellStyle },
          createElement(
            Text,
            { style: copyStyle },
            "If the button doesn’t work, copy and paste this link into your browser:",
          ),
          createElement(Link, { href, style: linkStyle }, href),
        ),
      ),
    ),
  );
}
