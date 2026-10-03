import { createElement, type ReactNode } from "react";
import { Container } from "@react-email/components";
import { cardPadding, cardStyle, emailTheme } from "../email-theme.ts";
import { EmailInset } from "./EmailInset.ts";

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
    createElement(
      EmailInset,
      {
        cellClassName: "email-card-padding",
        className: "email-card",
        padding: cardPadding,
        tableStyle: cardStyle,
      },
      children,
    ),
  );
}
