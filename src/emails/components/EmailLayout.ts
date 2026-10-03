import { createElement, type ReactNode } from "react";
import { Html } from "@react-email/components";
import { EmailDocumentHead } from "./EmailDocumentHead.ts";
import { EmailFrame } from "./EmailFrame.ts";

interface Properties {
  preview: string;
  children?: ReactNode;
}

export function EmailLayout(props: Properties) {
  const { preview, children } = props;

  return createElement(
    Html,
    { lang: "en" },
    createElement(EmailDocumentHead, { preview }),
    createElement(EmailFrame, null, children),
  );
}
