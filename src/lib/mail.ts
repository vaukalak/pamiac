import { createElement, type ReactNode } from "react";
import { Resend } from "resend";
import { ConfirmEmail, confirmEmailText } from "../emails/ConfirmEmail.ts";
import { MagicLinkEmail, magicLinkText } from "../emails/MagicLinkEmail.ts";
import { NoteAccessRequestEmail, noteAccessRequestText } from "../emails/NoteAccessRequestEmail.ts";
import { NoteSharedEmail, noteSharedText } from "../emails/NoteSharedEmail.ts";
import { ResetPasswordEmail, resetPasswordText } from "../emails/ResetPasswordEmail.ts";
import {
  WorkspaceInvitationEmail,
  workspaceInvitationText,
} from "../emails/WorkspaceInvitationEmail.ts";
import { SUPPORT_INBOX, SUPPORT_SUBJECT, supportRequestSchema } from "./support.ts";

// EMAIL_FROM is the only verified sender. Auth mail and notification mail share it.
// The environment does not define a separate notifications address.

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function singleLine(value: string) {
  return oneLine(value) || "a workspace";
}

function htmlShowsEscaped(html: string, safe: string) {
  return html.includes(safe) || html.includes(safe.replaceAll("&quot;", '"'));
}

async function deliverEmail(input: {
  email: string;
  url?: string;
  subject: string;
  html?: string;
  react?: ReactNode;
  text?: string;
  missingKey: string;
  log: string;
  failure: string;
  replyTo?: string;
  storeDevLink?: boolean;
  template: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(input.missingKey);
    }
    if (input.storeDevLink !== false) {
      const { getDb } = await import("../db");
      const { devMagicLinks } = await import("../db/schema");
      const url = input.url ?? "";
      await getDb()
        .insert(devMagicLinks)
        .values({ email: input.email.toLowerCase(), url, createdAt: new Date() })
        .onConflictDoUpdate({
          target: devMagicLinks.email,
          set: { url, createdAt: new Date() },
        });
    }
    console.info(input.log);
    return;
  }

  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is required when RESEND_API_KEY is set");

  const resend = new Resend(apiKey);
  const replyTo = input.replyTo ? { replyTo: input.replyTo } : {};
  const result = input.react
    ? await resend.emails.send({
        from,
        to: input.email,
        subject: input.subject,
        react: input.react,
        text: input.text ?? "",
        ...replyTo,
      })
    : await resend.emails.send({
        from,
        to: input.email,
        subject: input.subject,
        html: input.html ?? "",
        ...replyTo,
      });
  if (result.error) {
    const category = result.error.name || "provider";
    console.error(
      `email failed template=${input.template} recipient=${input.email} category=${category}`,
    );
    throw new Error(input.failure);
  }
  const messageId = result.data?.id;
  if (messageId) {
    console.info(`email sent template=${input.template} recipient=${input.email} id=${messageId}`);
  }
}

export async function sendMagicLink({ email, url }: { email: string; url: string }) {
  await deliverEmail({
    email,
    url,
    template: "magic-link",
    subject: "Sign in to Pamiac",
    react: createElement(MagicLinkEmail, { magicLink: url }),
    text: magicLinkText({ magicLink: url }),
    missingKey: "RESEND_API_KEY is required to send magic links",
    log: `Magic link for ${email}`,
    failure: "Could not send the magic link email",
  });
}

export async function sendWorkspaceInvite({
  email,
  url,
  workspaceName,
  inviterName,
  workspaceUrl,
}: {
  email: string;
  url: string;
  workspaceName: string;
  inviterName?: string;
  workspaceUrl?: string;
}) {
  const name = singleLine(workspaceName);
  const inviter = inviterName ? oneLine(inviterName) : "";
  const safeName = escapeHtml(name);
  const safeInviter = inviter ? escapeHtml(inviter) : "";
  const text = workspaceInvitationText({
    inviterName: inviter || undefined,
    workspaceName: name,
    acceptUrl: url,
    workspaceUrl,
  });
  const react = createElement(WorkspaceInvitationEmail, {
    inviterName: inviter || undefined,
    workspaceName: name,
    acceptUrl: url,
    workspaceUrl,
  });
  const { render } = await import("@react-email/render");
  const html = await render(react);
  if (!htmlShowsEscaped(html, safeName) || (safeInviter && !htmlShowsEscaped(html, safeInviter))) {
    throw new Error("Could not send the invitation email");
  }
  await deliverEmail({
    email,
    url,
    template: "workspace-invite",
    subject: inviter ? `${inviter} invited you to ${name}` : `You're invited to join ${name}`,
    react,
    text,
    missingKey: "RESEND_API_KEY is required to send workspace invitations",
    log: `Workspace invite for ${email}`,
    failure: "Could not send the invitation email",
  });
}

export async function sendDocumentPermissionRequest({
  email,
  requesterEmail,
  documentTitle,
  url,
  requesterName,
  approveUrl,
}: {
  email: string;
  requesterEmail: string;
  documentTitle: string;
  url: string;
  requesterName?: string;
  approveUrl?: string;
}) {
  const title = oneLine(documentTitle) || "a private document";
  const who = oneLine(requesterName || requesterEmail) || "Someone";
  const text = noteAccessRequestText({
    requesterName: who,
    noteTitle: title,
    viewUrl: url,
    approveUrl,
  });
  await deliverEmail({
    email,
    url,
    template: "access-request",
    subject: `${who} requested access to "${title}"`,
    react: createElement(NoteAccessRequestEmail, {
      requesterName: who,
      noteTitle: title,
      viewUrl: url,
      approveUrl,
    }),
    text,
    missingKey: "RESEND_API_KEY is required to send permission requests",
    log: `Permission request for ${email}`,
    failure: "Could not send the permission request email",
  });
}

export async function sendSupportRequest(input: { email: string; message: string }) {
  const request = supportRequestSchema.parse(input);
  const safeEmail = escapeHtml(request.email);
  const safeMessage = escapeHtml(request.message).replace(/\r?\n/g, "<br>");
  await deliverEmail({
    email: SUPPORT_INBOX,
    replyTo: request.email,
    storeDevLink: false,
    template: "support",
    subject: SUPPORT_SUBJECT,
    html: `<p>Pamiac support request from ${safeEmail}.</p><p>${safeMessage}</p>`,
    missingKey: "RESEND_API_KEY is required to send support requests",
    log: `Support request from ${request.email}: ${request.message}`,
    failure: "Could not send the support request",
  });
}

export async function sendEmailConfirmation({ email, url }: { email: string; url: string }) {
  await deliverEmail({
    email,
    url,
    template: "confirm-email",
    subject: "Confirm your Pamiac email",
    react: createElement(ConfirmEmail, { confirmationUrl: url }),
    text: confirmEmailText({ confirmationUrl: url }),
    storeDevLink: false,
    missingKey: "RESEND_API_KEY is required to send confirmation emails",
    log: `Email confirmation for ${email}`,
    failure: "Could not send the confirmation email",
  });
}

export async function sendPasswordReset({ email, url }: { email: string; url: string }) {
  await deliverEmail({
    email,
    url,
    template: "reset-password",
    subject: "Reset your Pamiac password",
    react: createElement(ResetPasswordEmail, { resetUrl: url }),
    text: resetPasswordText({ resetUrl: url }),
    storeDevLink: false,
    missingKey: "RESEND_API_KEY is required to send password resets",
    log: `Password reset for ${email}`,
    failure: "Could not send the password reset email",
  });
}

export async function sendNoteShared({
  email,
  url,
  senderName,
  noteTitle,
  noteExcerpt,
  accountRequired,
}: {
  email: string;
  url: string;
  senderName: string;
  noteTitle: string;
  noteExcerpt?: string;
  accountRequired: boolean;
}) {
  const sender = oneLine(senderName) || "Someone";
  const title = oneLine(noteTitle) || "a note";
  const excerpt = noteExcerpt ? oneLine(noteExcerpt) : "";
  await deliverEmail({
    email,
    url,
    template: "note-shared",
    subject: `${sender} shared "${title}" with you`,
    react: createElement(NoteSharedEmail, {
      senderName: sender,
      noteTitle: title,
      noteUrl: url,
      noteExcerpt: excerpt || undefined,
      accountRequired,
    }),
    text: noteSharedText({
      senderName: sender,
      noteTitle: title,
      noteUrl: url,
      noteExcerpt: excerpt || undefined,
      accountRequired,
    }),
    missingKey: "RESEND_API_KEY is required to send note shares",
    log: `Note shared with ${email}`,
    failure: "Could not send the note email",
  });
}
