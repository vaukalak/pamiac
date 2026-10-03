import assert from "node:assert/strict";
import { createElement } from "react";
import { describe, it } from "node:test";
import { ConfirmEmail } from "../emails/ConfirmEmail.ts";
import { FolderSharedEmail } from "../emails/FolderSharedEmail.ts";
import { MagicLinkEmail } from "../emails/MagicLinkEmail.ts";
import { NoteAccessRequestEmail } from "../emails/NoteAccessRequestEmail.ts";
import { NoteSharedEmail } from "../emails/NoteSharedEmail.ts";
import { ResetPasswordEmail } from "../emails/ResetPasswordEmail.ts";
import { WorkspaceInvitationEmail } from "../emails/WorkspaceInvitationEmail.ts";

const TOKEN = "a".repeat(180);
const MAGIC_LINK = `https://pamiac.test/api/auth/magic-link/verify?token=${TOKEN}&next=/notes/shared/folder`;

async function renderHtml(node: ReturnType<typeof createElement>) {
  const { render } = await import("@react-email/render");
  return render(node);
}

function declaresWidth(style: string) {
  return /(?:^|;)width:\s*100%/.test(style);
}

function declaresPadding(style: string) {
  return /(?:^|;)padding:/.test(style);
}

function attributeStyle(tag: string) {
  const style = tag.match(/style="([^"]*)"/);
  return style?.[1] ?? "";
}

function openingTagByClass(html: string, className: string) {
  const pattern = new RegExp(`<(table|td)\\b[^>]*class="${className}"[^>]*>`, "i");
  const match = html.match(pattern);
  assert.ok(match, `missing .${className}`);
  return match[0];
}

function assertCardPaddingOnCell(html: string) {
  const table = openingTagByClass(html, "email-card");
  const cell = openingTagByClass(html, "email-card-padding");
  const tableStyle = attributeStyle(table);
  const cellStyle = attributeStyle(cell);

  assert.match(table, /^<table/i);
  assert.match(cell, /^<td/i);
  assert.equal(declaresPadding(tableStyle), false);
  assert.match(tableStyle, /box-sizing:\s*border-box/);
  assert.match(tableStyle, /border-radius:\s*18px/);
  assert.match(cellStyle, /padding:\s*32px/);
  assert.match(html, /\.email-card-padding\s*\{[^}]*padding:\s*24px\s*!important/);
  assert.equal(/\.email-card\s*\{[^}]*padding/.test(html), false);
}

function assertBorderedTablesKeepPaddingInside(html: string) {
  const tables = html.matchAll(/<table\b[^>]*>/gi);
  for (const match of tables) {
    const tag = match[0];
    const style = attributeStyle(tag);
    if (!/border:\s*1px solid/.test(style)) continue;
    assert.equal(declaresPadding(style), false, tag);
    assert.match(style, /box-sizing:\s*border-box/);
    const after = html.slice((match.index ?? 0) + tag.length);
    const cell = after.match(/<td\b[^>]*>/);
    assert.ok(cell, tag);
    const cellStyle = attributeStyle(cell[0]);
    if (/border-radius:\s*18px/.test(style)) {
      assert.match(cellStyle, /padding:\s*32px/);
    }
    if (/border-radius:\s*12px/.test(style)) {
      assert.match(style, /margin:\s*16px 0/);
      assert.match(cellStyle, /padding:\s*16px/);
    }
  }
}

function styleBefore(html: string, label: string, tag: "<a " | "<td") {
  const index = html.indexOf(label);
  assert.ok(index > 0, `missing ${label}`);
  const before = html.slice(0, index);
  const start = before.lastIndexOf(tag);
  assert.ok(start >= 0, `missing ${tag} for ${label}`);
  const opening = before.slice(start);
  const style = opening.match(/style="([^"]*)"/);
  return style?.[1] ?? "";
}

describe("transactional email clipping", () => {
  it("keeps the sign-in label inside the card and the full magic link copyable", async () => {
    const html = await renderHtml(createElement(MagicLinkEmail, { magicLink: MAGIC_LINK }));
    const button = styleBefore(html, "Sign in to Pamiac →", "<a ");
    const cell = styleBefore(html, "Sign in to Pamiac →", "<td");

    assert.equal(declaresWidth(button), false);
    assert.equal(declaresPadding(button), false);
    assert.match(button, /max-width:\s*100%/);
    assert.match(cell, /box-sizing:\s*border-box/);
    assert.match(cell, /padding:\s*16px 24px/);
    assert.equal(declaresWidth(cell), false);
    assert.match(html, /box-sizing:\s*border-box/);
    assert.match(html, /table-layout:\s*fixed/);
    assert.match(html, /overflow-wrap:\s*anywhere/);
    assert.match(html, /word-break:\s*break-all/);
    assert.match(html, /max-width:\s*100%/);
    assert.equal(html.includes("…"), false);
    assert.ok(html.includes(TOKEN));
    assert.ok(html.includes("https://pamiac.test/api/auth/magic-link/verify?token="));
    assert.equal((html.match(new RegExp(TOKEN, "g")) ?? []).length >= 2, true);
    assertCardPaddingOnCell(html);
    assertBorderedTablesKeepPaddingInside(html);
  });

  it("uses the same unclipped button for the password reset email", async () => {
    const html = await renderHtml(
      createElement(ResetPasswordEmail, {
        resetUrl: "https://pamiac.test/reset?token=reset-token",
      }),
    );
    const button = styleBefore(html, "Reset password →", "<a ");
    const cell = styleBefore(html, "Reset password →", "<td");

    assert.equal(declaresWidth(button), false);
    assert.equal(declaresPadding(button), false);
    assert.equal(declaresWidth(cell), false);
    assert.match(html, /reset-token/);
    assert.match(html, /overflow-wrap:\s*anywhere/);
    assertCardPaddingOnCell(html);
    assertBorderedTablesKeepPaddingInside(html);
  });

  it("keeps a long note-share URL fully inside the card", async () => {
    const noteUrl = `https://pamiac.test/notes/share/${TOKEN}?ref=email-note`;
    const html = await renderHtml(
      createElement(NoteSharedEmail, {
        accountRequired: true,
        noteExcerpt: "Short excerpt",
        noteTitle: "Field notes",
        noteUrl,
        senderName: "Ada Lovelace",
      }),
    );
    const button = styleBefore(html, "Open note →", "<a ");

    assert.equal(declaresWidth(button), false);
    assert.equal(declaresPadding(button), false);
    assertCardPaddingOnCell(html);
    assertBorderedTablesKeepPaddingInside(html);
    assert.ok(html.includes(noteUrl));
    assert.ok(html.includes(TOKEN));
    assert.equal(html.includes("…"), false);
    assert.equal(/text-overflow:\s*ellipsis/.test(html), false);
    assert.match(html, /overflow-wrap:\s*anywhere/);
    assert.match(html, /word-break:\s*break-all/);
  });

  it("keeps a long folder-share URL fully inside the card", async () => {
    const folderUrl = `https://pamiac.test/folders/share/${TOKEN}?ref=email-folder`;
    const html = await renderHtml(
      createElement(FolderSharedEmail, {
        accountRequired: true,
        folderName: "Field maps",
        folderUrl,
        senderName: "Ada Lovelace",
      }),
    );
    const button = styleBefore(html, "Open folder →", "<a ");

    assert.equal(declaresWidth(button), false);
    assert.equal(declaresPadding(button), false);
    assertCardPaddingOnCell(html);
    assertBorderedTablesKeepPaddingInside(html);
    assert.ok(html.includes(folderUrl));
    assert.ok(html.includes(TOKEN));
    assert.equal(html.includes("…"), false);
    assert.equal(/text-overflow:\s*ellipsis/.test(html), false);
    assert.match(html, /overflow-wrap:\s*anywhere/);
    assert.match(html, /word-break:\s*break-all/);
  });

  it("keeps card padding on the cell for the other transactional emails", async () => {
    const pages = [
      createElement(ConfirmEmail, {
        confirmationUrl: "https://pamiac.test/confirm?token=confirm-token",
      }),
      createElement(WorkspaceInvitationEmail, {
        acceptUrl: "https://pamiac.test/join?token=join-token",
        inviterName: "Ada Lovelace",
        workspaceName: "Atlas",
      }),
      createElement(NoteAccessRequestEmail, {
        approveUrl: "https://pamiac.test/notes/field/approve",
        noteTitle: "Field notes",
        requesterName: "Ada Lovelace",
        viewUrl: "https://pamiac.test/notes/field",
      }),
    ];

    for (const page of pages) {
      const html = await renderHtml(page);
      assertCardPaddingOnCell(html);
      assertBorderedTablesKeepPaddingInside(html);
    }
  });
});
