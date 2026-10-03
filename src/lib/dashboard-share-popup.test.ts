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
    const frame = read("../components/share/share-dialog-frame.tsx");
    const surface = read("../components/share/share-dialog-surface.tsx");

    assert.match(frame, /className="share-backdrop"/);
    assert.match(frame, /onClick=\{onClose\}/);
    assert.match(modal, /event\.key === "Escape"/);
    assert.match(modal, /event\.key !== "Tab"/);
    assert.match(surface, /aria-modal="true"/);
    assert.match(surface, /role="dialog"/);
    assert.equal(modal.includes("workspacesQueryOptions"), false);
    assert.equal(modal.includes("ShareWorkspaceChoice"), false);
  });

  it("uses the shared controls and lime save only when the workspace stays put", () => {
    const modal = read("../components/share/share-modal.tsx");
    const surface = read("../components/share/share-dialog-surface.tsx");
    const heading = read("../components/share/share-dialog-heading.tsx");
    const hint = read("../components/share/share-dialog-hint.tsx");
    const shareActions = read("../components/share/share-actions.tsx");
    const screen = read("../components/document-screen.tsx");
    const css = read("../app/globals.css");

    assert.match(heading, /<Button className="ghost small"/);
    assert.match(hint, /<Paragraph>Control who can open this document\.<\/Paragraph>/);
    assert.match(hint, /<Paragraph>Only you can edit\.<\/Paragraph>/);
    assert.match(shareActions, /<Button className="library-lime"/);
    assert.match(shareActions, /<Alert>/);
    assert.match(shareActions, /<Paragraph className="hint">/);
    assert.match(surface, /share-access-dialog/);
    assert.equal(modal.includes("shareWorkspaceBody"), false);
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

  it("washes the selected share choice in faint lime and a lighter hover on the rest", () => {
    const css = read("../app/globals.css");

    assert.match(
      css,
      /\.library-shell \.workspace-add-dialog \.choice:has\(input:checked\) \{[^}]*background:\s*color-mix\(in srgb, var\(--home-lime\) 14%, transparent\)/,
    );
    assert.match(
      css,
      /\.library-shell \.workspace-add-dialog \.choice:hover:not\(:has\(input:checked\)\) \{[^}]*background:\s*color-mix\(in srgb, var\(--home-lime\) 6%, transparent\)/,
    );
  });
});
