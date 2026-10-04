import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";
import { shareDraftError, shareEmailList } from "../components/share/share-draft.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("share draft", () => {
  it("splits emails on commas and new lines and drops blanks", () => {
    assert.deepEqual(shareEmailList(" ada@example.com,\n\ngrace@example.com "), [
      "ada@example.com",
      "grace@example.com",
    ]);
  });

  it("requires an email only for the email mode", () => {
    const empty = { emails: "  \n", password: "", visibility: "emails" as const };
    assert.deepEqual(shareDraftError(empty, false), {
      field: "emails",
      message: "Add at least one email address",
    });
    assert.equal(shareDraftError({ ...empty, visibility: "private" }, false), null);
    assert.equal(shareDraftError({ ...empty, visibility: "public" }, false), null);
  });

  it("keeps a saved password when the field is left blank and rejects a short new one", () => {
    const draft = { emails: "", password: "", visibility: "password" as const };
    assert.equal(shareDraftError(draft, true), null);
    assert.deepEqual(shareDraftError(draft, false), {
      field: "password",
      message: "Set a password for this link",
    });
    assert.deepEqual(shareDraftError({ ...draft, password: "no" }, true), {
      field: "password",
      message: "Password must be at least 4 characters",
    });
    assert.equal(shareDraftError({ ...draft, password: "long" }, false), null);
  });
});

describe("share popup", () => {
  it("drops the workspace section and keeps the saved access mode as the draft", () => {
    const modal = read("../components/share/share-modal.tsx");
    const list = read("../components/share/share-mode-list.tsx");
    const shareDir = readdirSync(new URL("../components/share/", import.meta.url));
    const popup = shareDir
      .filter((name) => name.endsWith(".tsx"))
      .map((name) => read(`../components/share/${name}`))
      .join("\n");

    assert.equal(shareDir.includes("share-workspace-choice.tsx"), false);
    assert.equal(shareDir.includes("share-workspace-option.tsx"), false);
    assert.equal(/Personal library/.test(popup), false);
    assert.equal(/Who can open the link stays/.test(popup), false);
    assert.equal(/<ShareWorkspaceChoice/.test(popup), false);
    assert.match(modal, /defaultValues:\s*\{[\s\S]*visibility,/);
    assert.match(modal, /if \(saveShare\.isPending\) return/);
    assert.match(modal, /password:\s*\n?\s*values\.visibility === "password" && values\.password/);
    assert.equal(modal.includes("shareWorkspaceBody"), false);
    assert.match(list, /Who can open this document/);
    assert.match(list, /Only you can open it\./);
    assert.match(list, /Invited people sign in with that email to view\./);
    assert.match(list, /Anyone with the link and the password can view\./);
    assert.match(list, /Anyone with the link can view\./);
  });

  it("closes without saving and leaves the draft in place when saving fails", () => {
    const modal = read("../components/share/share-modal.tsx");
    const saveStart = modal.indexOf("async function save");
    const save = modal.slice(saveStart, modal.indexOf("onSuccess", saveStart));

    const frame = read("../components/share/share-dialog-frame.tsx");
    assert.match(frame, /onClick=\{onClose\}/);
    assert.match(modal, /event\.key === "Escape"[\s\S]*onCloseRef\.current\(\)/);
    assert.equal(save.includes("onClose"), false);
    assert.match(modal, /throw new Error\(body\?\.error \?\? "Could not update sharing"\)/);
    assert.match(modal, /onSuccess: \(share\) => \{[\s\S]*form\.setValue\("password", ""\)/);
    assert.equal(modal.includes("form.reset"), false);
  });

  it("places markdown actions after the divider and only for an unlocked note", () => {
    const modal = read("../components/share/share-modal.tsx");
    const footer = read("../components/share/share-access-footer.tsx");
    const screen = read("../components/document-screen.tsx");
    const folder = read("../components/library/folder-share-modal.tsx");
    const note = read("../components/note/note-share-markdown.tsx");

    assert.match(
      modal,
      /markdownSlot && !lockWorkspace \? <div id="note-share-markdown" \/> : null/,
    );
    assert.ok(footer.indexOf("share-access-divider") < footer.indexOf("{children}"));
    assert.ok(footer.indexOf("{children}") < footer.indexOf("<ShareActions"));
    assert.match(screen, /markdownSlot=\{type === "note"\}/);
    assert.equal(folder.includes("markdownSlot"), false);
    assert.match(note, /Copy Markdown|NoteCopyMarkdown/);
    assert.match(note, /NoteExport/);
    assert.equal(note.includes("saveShare"), false);
  });

  it("paints an opaque dialog and keeps the selected card in lime", () => {
    const css = readStylesheet();
    const access = css.slice(css.indexOf(".library-shell .share-access-dialog {"));

    assert.match(access, /background:\s*var\(--home-menu\)/);
    assert.equal(/background:\s*rgba\(/.test(access.slice(0, access.indexOf("}"))), false);
    assert.match(access, /width:\s*min\(580px, 100%\)/);
    assert.match(access, /border-radius:\s*20px/);
    assert.match(access, /max-height:\s*calc\(100dvh - 32px\)/);
    assert.match(css, /\.share-access-dialog \{[^]*?padding:\s*32px;/);
    assert.match(
      css,
      /\.share-access-dialog \.choice:has\(input:checked\) \{[^}]*border-color:\s*var\(--home-lime\)/,
    );
    assert.match(css, /@media \(max-width: 420px\) \{[\s\S]*grid-template-columns:\s*1fr/);
  });
});
