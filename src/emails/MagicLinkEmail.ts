import { createElement } from "react";
import { MAGIC_LINK_EXPIRES_MINUTES } from "../lib/email-expiry.ts";
import { EmailButton } from "./components/EmailButton.ts";
import { EmailFallbackLink } from "./components/EmailFallbackLink.ts";
import { EmailFooter } from "./components/EmailFooter.ts";
import { EmailHeader } from "./components/EmailHeader.ts";
import { EmailInfoBox } from "./components/EmailInfoBox.ts";
import { EmailIntro } from "./components/EmailIntro.ts";
import { EmailLayout } from "./components/EmailLayout.ts";

interface Properties {
  magicLink: string;
}

const SAFETY = "If you didn’t request this link, you can safely ignore this email.";

function bodyCopy() {
  return `Click the button below to securely sign in to your Pamiac account. This link will expire in ${MAGIC_LINK_EXPIRES_MINUTES} minutes.`;
}

export function MagicLinkEmail(props: Properties) {
  const { magicLink } = props;

  return createElement(
    EmailLayout,
    { preview: "Sign in to Pamiac" },
    createElement(EmailHeader),
    createElement(EmailIntro, {
      eyebrow: "SIGN IN",
      title: "Sign in to Pamiac",
      body: bodyCopy(),
    }),
    createElement(EmailButton, { href: magicLink, label: "Sign in to Pamiac →" }),
    createElement(EmailFallbackLink, { href: magicLink }),
    createElement(EmailInfoBox, { text: SAFETY }),
    createElement(EmailFooter),
  );
}

export function magicLinkText(props: Properties) {
  const { magicLink } = props;

  return ["SIGN IN", "Sign in to Pamiac", bodyCopy(), magicLink, SAFETY, footerLine()].join("\n\n");
}

function footerLine() {
  return "Pamiac · A shared mind for you and your agents.";
}
