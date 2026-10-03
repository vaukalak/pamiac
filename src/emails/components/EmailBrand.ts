import { createElement } from "react";
import { Row } from "@react-email/components";
import { EmailLogo } from "./EmailLogo.ts";
import { EmailWordmark } from "./EmailWordmark.ts";

export function EmailBrand() {
  return createElement(Row, null, createElement(EmailLogo), createElement(EmailWordmark));
}
