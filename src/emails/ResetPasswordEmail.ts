import { createElement } from "react";
import { passwordResetExpiryPhrase } from "../lib/email-expiry.ts";
import { EmailButton } from "./components/EmailButton.ts";
import { EmailFallbackLink } from "./components/EmailFallbackLink.ts";
import { EmailFooter } from "./components/EmailFooter.ts";
import { EmailHeader } from "./components/EmailHeader.ts";
import { EmailInfoBox } from "./components/EmailInfoBox.ts";
import { EmailIntro } from "./components/EmailIntro.ts";
import { EmailLayout } from "./components/EmailLayout.ts";

interface Properties {
  resetUrl: string;
}

const SAFETY =
  "If you didn’t request a password reset, you can safely ignore this email. Your password will remain unchanged.";
const FOOTER = "Pamiac · A shared mind for you and your agents.";

function bodyCopy() {
  return `We received a request to reset your Pamiac password. Click the button below to set a new password. This link will expire in ${passwordResetExpiryPhrase()}.`;
}

export function ResetPasswordEmail(props: Properties) {
  const { resetUrl } = props;

  return createElement(
    EmailLayout,
    { preview: "Reset your password" },
    createElement(EmailHeader),
    createElement(EmailIntro, {
      eyebrow: "RESET PASSWORD",
      title: "Reset your password",
      body: bodyCopy(),
    }),
    createElement(EmailButton, { href: resetUrl, label: "Reset password →" }),
    createElement(EmailFallbackLink, { href: resetUrl }),
    createElement(EmailInfoBox, { text: SAFETY }),
    createElement(EmailFooter),
  );
}

export function resetPasswordText(props: Properties) {
  const { resetUrl } = props;

  return ["RESET PASSWORD", "Reset your password", bodyCopy(), resetUrl, SAFETY, FOOTER].join(
    "\n\n",
  );
}
