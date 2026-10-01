import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("dashboard share popup", () => {
  it("closes the card menu and portals the dialog onto the library shell", () => {
    const menu = read("../components/library/document-menu.tsx");
    const portal = read("../components/library/document-share-portal.tsx");
    const card = read("../components/library/document-card.tsx");
    const actions = read("../components/library/document-menu-actions.tsx");

    assert.match(menu, /close\(\);\s*setSharing\(true\)/);
    assert.match(menu, /<DocumentSharePortal>/);
    assert.match(menu, /lockWorkspace/);
    assert.equal(card.includes("ShareModal"), false);
    assert.match(portal, /createPortal\(children, root\)/);
    assert.match(portal, /querySelector\("\.library-shell"\)/);
    assert.match(portal, /document\.body/);
    assert.match(actions, /Rename/);
    assert.match(actions, /Share/);
    assert.match(actions, /Delete/);
  });

  it("keeps escape, backdrop dismiss, and the focus trap on the shared dialog", () => {
    const modal = read("../components/share/share-modal.tsx");

    assert.match(modal, /className="share-backdrop"/);
    assert.match(modal, /onClick=\{onClose\}/);
    assert.match(modal, /event\.key === "Escape"/);
    assert.match(modal, /event\.key !== "Tab"/);
    assert.match(modal, /aria-modal="true"/);
    assert.match(modal, /enabled: !lockWorkspace/);
  });

  it("uses the shared controls and lime save only when the workspace stays put", () => {
    const modal = read("../components/share/share-modal.tsx");
    const shareActions = read("../components/share/share-actions.tsx");
    const screen = read("../components/document-screen.tsx");
    const css = read("../app/globals.css");

    assert.match(modal, /<Button className="ghost small"/);
    assert.match(modal, /<Paragraph className="hint" id="share-dialog-hint">/);
    assert.match(shareActions, /<Button className=\{saveClassName\}/);
    assert.match(shareActions, /<Alert>/);
    assert.match(shareActions, /<Paragraph className="hint">/);
    assert.match(modal, /saveClassName=\{lockWorkspace \? "library-lime" : undefined\}/);
    assert.match(modal, /lockWorkspace \? "share-dialog workspace-add-dialog" : "share-dialog"/);
    assert.equal(screen.includes("lockWorkspace"), false);
    assert.match(screen, /<ShareModal/);
    assert.match(
      css,
      /\.library-shell \.workspace-add-dialog h2 \{[^}]*font-family:\s*var\(--sans\)/,
    );
    assert.match(
      css,
      /\.library-shell \.btn\.library-lime \{[^}]*background:\s*var\(--home-lime\)/,
    );
    assert.match(
      css,
      /\.library-shell \.workspace-add-dialog \.share-link \.btn\.secondary \{[^}]*color:\s*var\(--home-text\)/,
    );
    assert.match(
      css,
      /\.library-shell \.workspace-add-dialog \.workspace-create button \{[^}]*background:\s*var\(--home-lime\)/,
    );
    assert.match(
      css,
      /\.library-shell \.workspace-add-dialog \.choice span \{[^}]*color:\s*var\(--home-soft\)/,
    );
  });
});
