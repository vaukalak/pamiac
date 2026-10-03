import assert from "node:assert/strict";
import { createElement } from "react";
import { describe, it } from "node:test";
import { MagicLinkEmail } from "../emails/MagicLinkEmail.ts";
import { ResetPasswordEmail } from "../emails/ResetPasswordEmail.ts";

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
  });
});
