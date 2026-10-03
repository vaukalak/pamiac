import { createElement, type ReactNode } from "react";
import { Body } from "@react-email/components";
import { bodyStyle } from "../email-theme.ts";
import { EmailCard } from "./EmailCard.ts";

interface Properties {
  children: ReactNode;
}

export function EmailFrame(props: Properties) {
  const { children } = props;

  return createElement(Body, { style: bodyStyle }, createElement(EmailCard, { children }));
}
