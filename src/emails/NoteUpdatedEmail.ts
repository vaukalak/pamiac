import { createElement } from "react";
import { EmailButton } from "./components/EmailButton.ts";
import { EmailDocumentCard } from "./components/EmailDocumentCard.ts";
import { EmailFallbackLink } from "./components/EmailFallbackLink.ts";
import { EmailFooter } from "./components/EmailFooter.ts";
import { EmailHeader } from "./components/EmailHeader.ts";
import { EmailIntro } from "./components/EmailIntro.ts";
import { EmailLayout } from "./components/EmailLayout.ts";

interface Properties {
  noteTitle: string;
  noteUrl: string;
}

const FOOTER = "Pamiac · A shared mind for you and your agents.";

function bodyCopy(noteTitle: string) {
  return `“${noteTitle}” was updated on Pamiac.`;
}

export function NoteUpdatedEmail(props: Properties) {
  const { noteTitle, noteUrl } = props;

  return createElement(
    EmailLayout,
    { preview: `${noteTitle} was updated` },
    createElement(EmailHeader),
    createElement(EmailIntro, {
      eyebrow: "NOTE UPDATED",
      title: "Your note was updated",
      body: bodyCopy(noteTitle),
    }),
    createElement(EmailDocumentCard, { title: noteTitle }),
    createElement(EmailButton, { href: noteUrl, label: "Open note →" }),
    createElement(EmailFallbackLink, { href: noteUrl }),
    createElement(EmailFooter),
  );
}

export function noteUpdatedText(props: Properties) {
  const { noteTitle, noteUrl } = props;
  return [
    "NOTE UPDATED",
    "Your note was updated",
    bodyCopy(noteTitle),
    noteTitle,
    noteUrl,
    FOOTER,
  ].join("\n\n");
}
