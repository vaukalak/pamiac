import { createElement } from "react";
import { Head, Preview } from "@react-email/components";

interface Properties {
  preview: string;
}

const mobileCss = [
  "@media only screen and (max-width: 600px) {",
  ".email-card-padding { padding: 24px !important; }",
  ".email-title { font-size: 28px !important; line-height: 32px !important; }",
  "}",
].join(" ");

export function EmailDocumentHead(props: Properties) {
  const { preview } = props;

  return createElement(
    Head,
    null,
    createElement("meta", { name: "color-scheme", content: "dark" }),
    createElement("meta", { name: "supported-color-schemes", content: "dark" }),
    createElement("style", null, mobileCss),
    createElement(Preview, null, preview),
  );
}
