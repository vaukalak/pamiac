import { createElement } from "react";
import { EmailButton } from "./components/EmailButton.ts";
import { EmailFallbackLink } from "./components/EmailFallbackLink.ts";
import { EmailFooter } from "./components/EmailFooter.ts";
import { EmailHeader } from "./components/EmailHeader.ts";
import { EmailInfoBox } from "./components/EmailInfoBox.ts";
import { EmailIntro } from "./components/EmailIntro.ts";
import { EmailLayout } from "./components/EmailLayout.ts";
import { EmailWorkspaceCard } from "./components/EmailWorkspaceCard.ts";

interface Properties {
  inviterName?: string;
  workspaceName: string;
  acceptUrl: string;
  workspaceUrl?: string;
  description?: string;
}

const SAFETY = "If you weren’t expecting this invitation, you can ignore this email.";
const FOOTER = "Pamiac · A shared mind for you and your agents.";

function bodyCopy(workspaceName: string, inviterName?: string) {
  if (inviterName) {
    return `${inviterName} invited you to join the “${workspaceName}” workspace on Pamiac.`;
  }
  return `You are invited to join the “${workspaceName}” workspace on Pamiac.`;
}

export function WorkspaceInvitationEmail(props: Properties) {
  const { inviterName, workspaceName, acceptUrl, workspaceUrl, description } = props;
  const details = workspaceUrl && workspaceUrl !== acceptUrl ? workspaceUrl : "";

  return createElement(
    EmailLayout,
    { preview: "You’re invited to join a Pamiac workspace" },
    createElement(EmailHeader),
    createElement(EmailIntro, {
      eyebrow: "WORKSPACE INVITATION",
      title: "You’re invited to join a Pamiac workspace",
      body: bodyCopy(workspaceName, inviterName),
    }),
    createElement(EmailWorkspaceCard, { name: workspaceName, description }),
    createElement(EmailButton, { href: acceptUrl, label: "Accept invitation →" }),
    details
      ? createElement(EmailButton, {
          href: details,
          label: "View workspace details",
          tone: "secondary",
        })
      : null,
    createElement(EmailFallbackLink, { href: acceptUrl }),
    createElement(EmailInfoBox, { text: SAFETY }),
    createElement(EmailFooter),
  );
}

export function workspaceInvitationText(props: Properties) {
  const { inviterName, workspaceName, acceptUrl, workspaceUrl } = props;
  const details = workspaceUrl && workspaceUrl !== acceptUrl ? workspaceUrl : "";
  const lines = [
    "WORKSPACE INVITATION",
    "You’re invited to join a Pamiac workspace",
    bodyCopy(workspaceName, inviterName),
    workspaceName,
    acceptUrl,
  ];
  if (details) lines.push(details);
  lines.push(SAFETY, FOOTER);
  return lines.join("\n\n");
}
