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
  requesterName: string;
  noteTitle: string;
  viewUrl: string;
  approveUrl?: string;
}

const MANAGE = "You can manage access permissions in your workspace settings.";
const FOOTER = "Pamiac · A shared mind for you and your agents.";

function bodyCopy(requesterName: string, noteTitle: string) {
  return `${requesterName} would like to access the note “${noteTitle}” in your workspace.`;
}

export function NoteAccessRequestEmail(props: Properties) {
  const { requesterName, noteTitle, viewUrl, approveUrl } = props;
  const approve = approveUrl && approveUrl !== viewUrl ? approveUrl : "";

  return createElement(
    EmailLayout,
    { preview: `${requesterName} requested access to a note` },
    createElement(EmailHeader),
    createElement(EmailIntro, {
      eyebrow: "ACCESS REQUEST",
      title: `${requesterName} requested access to a note`,
      body: bodyCopy(requesterName, noteTitle),
    }),
    createElement(EmailDocumentCard, { title: noteTitle }),
    approve
      ? createElement(EmailButton, { href: approve, label: "Approve request →" })
      : createElement(EmailButton, { href: viewUrl, label: "View note" }),
    approve
      ? createElement(EmailButton, { href: viewUrl, label: "View note", tone: "secondary" })
      : null,
    createElement(EmailFallbackLink, { href: approve || viewUrl }),
    createElement(EmailInfoBox, { text: MANAGE }),
    createElement(EmailFooter),
  );
}

export function noteAccessRequestText(props: Properties) {
  const { requesterName, noteTitle, viewUrl, approveUrl } = props;
  const approve = approveUrl && approveUrl !== viewUrl ? approveUrl : "";
  const lines = [
    "ACCESS REQUEST",
    `${requesterName} requested access to a note`,
    bodyCopy(requesterName, noteTitle),
    noteTitle,
  ];
  if (approve) lines.push(approve);
  lines.push(viewUrl, MANAGE, FOOTER);
  return lines.join("\n\n");
}
