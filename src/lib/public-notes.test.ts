import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { privacyNote, termsNote } from "./public-notes.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

const privacyPage = read("../app/privacy/page.tsx");
const termsPage = read("../app/terms/page.tsx");
const note = read("../components/public-note/public-note.tsx");
const document = read("../components/public-note/public-note-document.tsx");
const tools = read("../components/public-note/public-note-tools.tsx");
const body = read("../components/public-note/public-note-body.tsx");
const block = read("../components/public-note/public-note-block.tsx");
const submission = read("../../chatgpt/submission.md");

describe("public privacy and terms notes", () => {
  it("serves both notes from the app with the facts the plugin listing needs", () => {
    for (const noteContent of [privacyNote, termsNote]) {
      assert.match(noteContent.markdown, /magic link/);
      assert.match(noteContent.markdown, /Google/);
      assert.match(noteContent.markdown, /private, invited emails, a password, or public/);
      assert.match(noteContent.markdown, /embeddings/);
      assert.match(noteContent.markdown, /https:\/\/pamiac\.com\/oauth\/consent/);
      assert.match(noteContent.markdown, /ChatGPT does not receive PAMIAC_TOKEN/);
      assert.match(noteContent.markdown, /https:\/\/pamiac\.com\/support/);
      assert.equal(noteContent.markdown.includes("joke"), false);
    }
    assert.match(privacyNote.markdown, /session cookie/);
    assert.match(privacyNote.markdown, /hash of the password/);
    assert.match(privacyNote.markdown, /Password sign-up is closed/);
    assert.match(privacyNote.markdown, /does not receive PAMIAC_TOKEN or your password/);
    assert.match(termsNote.markdown, /existing email and password/);
    assert.match(privacyNote.markdown, /Categories we collect/);
    assert.match(privacyNote.markdown, /IP address/);
    assert.match(privacyNote.markdown, /Purposes/);
    assert.match(privacyNote.markdown, /Recipients/);
    assert.match(privacyNote.markdown, /Resend/);
    assert.match(privacyNote.markdown, /Retention/);
    assert.match(privacyNote.markdown, /5 minutes/);
    assert.match(privacyNote.markdown, /7 days/);
    assert.match(privacyNote.markdown, /Controls/);
    assert.match(privacyNote.markdown, /support@pamiac\.com/);
    assert.match(termsNote.markdown, /access you approve/);
    assert.equal(privacyNote.title, "Privacy policy");
    assert.equal(termsNote.title, "Terms");
  });

  it("renders the notes at /privacy and /terms without a library row or a sign-in gate", () => {
    assert.match(privacyPage, /privacyNote/);
    assert.match(termsPage, /termsNote/);
    assert.match(privacyPage, /<PublicNote /);
    assert.match(termsPage, /<PublicNote /);
    for (const page of [privacyPage, termsPage, note, document]) {
      assert.equal(page.includes("getLibrarySession"), false);
      assert.equal(page.includes("getDocumentBundle"), false);
      assert.equal(page.includes("redirect("), false);
      assert.equal(page.includes("owner_id"), false);
    }
    assert.match(note, /email=\{null\}/);
    assert.match(document, /<NoteTitle disabled/);
    assert.match(tools, /<SaveState canEdit=\{false\}/);
    assert.match(tools, /<span className="badge">public<\/span>/);
    assert.match(body, /<PublicNoteBlock /);
    assert.match(block, /<Paragraph>/);
  });

  it("lists the public HTTPS URLs in the ChatGPT submission", () => {
    assert.match(submission, /https:\/\/pamiac\.com\/privacy/);
    assert.match(submission, /https:\/\/pamiac\.com\/terms/);
    assert.match(submission, /Support: https:\/\/pamiac\.com\/support/);
    assert.equal(submission.includes("still need public HTTPS URLs"), false);
  });
});
