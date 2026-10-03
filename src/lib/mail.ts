import { SUPPORT_INBOX, SUPPORT_SUBJECT, supportRequestSchema } from "./support.ts";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function singleLine(value: string) {
  const trimmed = value.replace(/[\r\n]+/g, " ").trim();
  return trimmed || "a workspace";
}

async function deliverEmail(input: {
  email: string;
  url?: string;
  subject: string;
  html: string;
  missingKey: string;
  log: string;
  failure: string;
  replyTo?: string;
  storeDevLink?: boolean;
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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.email,
      reply_to: input.replyTo,
      subject: input.subject,
      html: input.html,
    }),
  });
  if (!response.ok) throw new Error(input.failure);
}

export async function sendMagicLink({ email, url }: { email: string; url: string }) {
  await deliverEmail({
    email,
    url,
    subject: "Your Pamiac sign-in link",
    html: `<p>Use this link to sign in to Pamiac. It expires in 5 minutes.</p><p><a href="${url}">Sign in</a></p>`,
    missingKey: "RESEND_API_KEY is required to send magic links",
    log: `Magic link for ${email}: ${url}`,
    failure: "Could not send the magic link email",
  });
}

export async function sendPasswordReset({ email, url }: { email: string; url: string }) {
  const safeUrl = escapeHtml(url);
  await deliverEmail({
    email,
    url,
    subject: "Reset your Pamiac password",
    html: `<p>Use this link to set a new Pamiac password. It expires in 1 hour.</p><p><a href="${safeUrl}">Reset password</a></p>`,
    missingKey: "RESEND_API_KEY is required to send password reset emails",
    log: `Password reset for ${email}: ${url}`,
    failure: "Could not send the password reset email",
  });
}

export async function sendWorkspaceInvite({
  email,
  url,
  workspaceName,
}: {
  email: string;
  url: string;
  workspaceName: string;
}) {
  const name = singleLine(workspaceName);
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(url);
  await deliverEmail({
    email,
    url,
    subject: `Join ${name} on Pamiac`,
    html: `<p>You are invited to ${safeName}.</p><p><a href="${safeUrl}">Open the invitation</a></p>`,
    missingKey: "RESEND_API_KEY is required to send workspace invitations",
    log: `Workspace invite for ${email}: ${url}`,
    failure: "Could not send the invitation email",
  });
}

export async function sendDocumentPermissionRequest({
  email,
  requesterEmail,
  documentTitle,
  url,
}: {
  email: string;
  requesterEmail: string;
  documentTitle: string;
  url: string;
}) {
  const title = documentTitle.replace(/[\r\n]+/g, " ").trim() || "a private document";
  const who = requesterEmail.replace(/[\r\n]+/g, " ").trim();
  const safeTitle = escapeHtml(title);
  const safeWho = escapeHtml(who);
  const safeUrl = escapeHtml(url);
  await deliverEmail({
    email,
    url,
    subject: `Permission request for ${title}`,
    html: `<p>${safeWho} asked to open “${safeTitle}”.</p><p><a href="${safeUrl}">Open the document</a></p>`,
    missingKey: "RESEND_API_KEY is required to send permission requests",
    log: `Permission request for ${email}: ${url}`,
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
    subject: SUPPORT_SUBJECT,
    html: `<p>Pamiac support request from ${safeEmail}.</p><p>${safeMessage}</p>`,
    missingKey: "RESEND_API_KEY is required to send support requests",
    log: `Support request from ${request.email}: ${request.message}`,
    failure: "Could not send the support request",
  });
}
