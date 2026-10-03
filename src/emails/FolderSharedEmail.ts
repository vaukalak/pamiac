import { createElement } from "react";
import { EmailButton } from "./components/EmailButton.ts";
import { EmailDocumentCard } from "./components/EmailDocumentCard.ts";
import { EmailFallbackLink } from "./components/EmailFallbackLink.ts";
import { EmailFooter } from "./components/EmailFooter.ts";
import { EmailHeader } from "./components/EmailHeader.ts";
import { EmailInfoBox } from "./components/EmailInfoBox.ts";
import { EmailIntro } from "./components/EmailIntro.ts";
import { EmailLayout } from "./components/EmailLayout.ts";

interface Properties {
  senderName: string;
  folderName: string;
  folderUrl: string;
  accountRequired: boolean;
}

const ACCOUNT =
  "You’ll need a Pamiac account to view this folder. It’s free and takes less than a minute.";
const FOOTER = "Pamiac · A shared mind for you and your agents.";

function bodyCopy(senderName: string, folderName: string) {
  return `${senderName} shared the folder “${folderName}” with you on Pamiac.`;
}

export function FolderSharedEmail(props: Properties) {
  const { senderName, folderName, folderUrl, accountRequired } = props;

  return createElement(
    EmailLayout,
    { preview: `${senderName} shared a folder with you` },
    createElement(EmailHeader),
    createElement(EmailIntro, {
      eyebrow: "FOLDER SHARED",
      title: `${senderName} shared a folder with you`,
      body: bodyCopy(senderName, folderName),
    }),
    createElement(EmailDocumentCard, { title: folderName }),
    createElement(EmailButton, { href: folderUrl, label: "Open folder →" }),
    createElement(EmailFallbackLink, { href: folderUrl }),
    accountRequired ? createElement(EmailInfoBox, { text: ACCOUNT }) : null,
    createElement(EmailFooter),
  );
}

export function folderSharedText(props: Properties) {
  const { senderName, folderName, folderUrl, accountRequired } = props;
  const lines = [
    "FOLDER SHARED",
    `${senderName} shared a folder with you`,
    bodyCopy(senderName, folderName),
    folderName,
    folderUrl,
  ];
  if (accountRequired) lines.push(ACCOUNT);
  lines.push(FOOTER);
  return lines.join("\n\n");
}
