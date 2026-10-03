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
  noteTitle: string;
  noteUrl: string;
  noteExcerpt?: string;
  accountRequired: boolean;
}

const ACCOUNT =
  "You’ll need a Pamiac account to view this note. It’s free and takes less than a minute.";
const FOOTER = "Pamiac · A shared mind for you and your agents.";

function bodyCopy(senderName: string, noteTitle: string) {
  return `${senderName} shared “${noteTitle}” with you on Pamiac.`;
}

export function NoteSharedEmail(props: Properties) {
  const { senderName, noteTitle, noteUrl, noteExcerpt, accountRequired } = props;

  return createElement(
    EmailLayout,
    { preview: `${senderName} shared a note with you` },
    createElement(EmailHeader),
    createElement(EmailIntro, {
      eyebrow: "NOTE SHARED",
      title: `${senderName} shared a note with you`,
      body: bodyCopy(senderName, noteTitle),
    }),
    createElement(EmailDocumentCard, { title: noteTitle, excerpt: noteExcerpt }),
    createElement(EmailButton, { href: noteUrl, label: "Open note →" }),
    createElement(EmailFallbackLink, { href: noteUrl }),
    accountRequired ? createElement(EmailInfoBox, { text: ACCOUNT }) : null,
    createElement(EmailFooter),
  );
}

export function noteSharedText(props: Properties) {
  const { senderName, noteTitle, noteUrl, accountRequired } = props;
  const lines = [
    "NOTE SHARED",
    `${senderName} shared a note with you`,
    bodyCopy(senderName, noteTitle),
    noteTitle,
    noteUrl,
  ];
  if (accountRequired) lines.push(ACCOUNT);
  lines.push(FOOTER);
  return lines.join("\n\n");
}
