import { createElement } from "react";
import { EmailButton } from "./components/EmailButton.ts";
import { EmailFallbackLink } from "./components/EmailFallbackLink.ts";
import { EmailFooter } from "./components/EmailFooter.ts";
import { EmailHeader } from "./components/EmailHeader.ts";
import { EmailIntro } from "./components/EmailIntro.ts";
import { EmailLayout } from "./components/EmailLayout.ts";

interface Properties {
  confirmationUrl: string;
}

const BODY =
  "Thanks for joining Pamiac. Please confirm your email address to activate your account and get started.";
const FOOTER = "Pamiac · A shared mind for you and your agents.";

export function ConfirmEmail(props: Properties) {
  const { confirmationUrl } = props;

  return createElement(
    EmailLayout,
    { preview: "Confirm your email" },
    createElement(EmailHeader),
    createElement(EmailIntro, {
      eyebrow: "CONFIRM EMAIL",
      title: "Confirm your email",
      body: BODY,
    }),
    createElement(EmailButton, { href: confirmationUrl, label: "Confirm email →" }),
    createElement(EmailFallbackLink, { href: confirmationUrl }),
    createElement(EmailFooter),
  );
}

export function confirmEmailText(props: Properties) {
  const { confirmationUrl } = props;

  return ["CONFIRM EMAIL", "Confirm your email", BODY, confirmationUrl, FOOTER].join("\n\n");
}
