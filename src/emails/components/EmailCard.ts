import { createElement, type ReactNode } from "react";
import { Container, Section } from "@react-email/components";
import { cardStyle, emailTheme } from "../email-theme.ts";

interface Properties {
  children: ReactNode;
}

export function EmailCard(props: Properties) {
  const { children } = props;

  return createElement(
    Container,
    {
      style: {
        margin: "0 auto",
        maxWidth: emailTheme.width,
        width: "100%",
      },
    },
    createElement(Section, { className: "email-card", style: cardStyle }, children),
  );
}
