import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("token form dialog", () => {
  it("opens create in a popup and keeps the secret on the form after success", () => {
    const create = read("src/components/tokens/token-create.tsx");
    const form = read("src/components/tokens/token-create-form.tsx");

    const createDialog = read("src/components/tokens/token-create-dialog.tsx");

    assert.match(create, /expanded=\{open\}/);
    assert.match(create, /<TokenCreateDialog onClose=\{/);
    assert.match(createDialog, /title="Create API key"/);
    assert.match(createDialog, /<TokenCreateForm \/>/);
    assert.match(createDialog, /<TokenFormDialog/);
    assert.doesNotMatch(create, /token-row-expanded|TokenRowExpanded/);
    assert.match(form, /mutation\.data \? <TokenSecret/);
    assert.doesNotMatch(form, /onClose|setOpen\(false\)/);
  });

  it("opens expand in a popup with the update body and no extra table row", () => {
    const row = read("src/components/tokens/token-row.tsx");
    const body = read("src/components/tokens/token-expanded-body.tsx");
    const actions = read("src/components/tokens/token-expanded-actions.tsx");
    const update = read("src/components/tokens/token-update-form.tsx");
    const expand = read("src/components/tokens/token-expand-cell.tsx");

    const updateDialog = read("src/components/tokens/token-update-dialog.tsx");

    assert.match(row, /<TokenUpdateDialog /);
    assert.match(updateDialog, /title="Update API key"/);
    assert.match(updateDialog, /<TokenExpandedBody token=\{token\} \/>/);
    assert.match(row, /expanded=\{expanded\}/);
    assert.doesNotMatch(row, /<tr|token-row-expanded|TokenRowExpanded|TokenExpandedCell/);
    assert.match(expand, /expanded=\{expanded\}/);
    assert.match(body, /Created \{formatTokenWhen/);
    assert.match(body, /<TokenViewSetup \/>/);
    assert.match(body, /<TokenExpandedActions token=\{token\} \/>/);
    assert.match(actions, /if \(token\.revokedAt\) return null/);
    assert.match(actions, /<TokenUpdateForm token=\{token\} \/>/);
    assert.match(update, /Scope saved\./);
    assert.equal(existsSync(join(root, "src/components/tokens/token-row-expanded.tsx")), false);
    assert.equal(existsSync(join(root, "src/components/tokens/token-expanded-cell.tsx")), false);
  });

  it("portals one dialog into the library shell and traps focus like the connection dialog", () => {
    const dialog = read("src/components/tokens/token-form-dialog.tsx");
    const panel = read("src/components/tokens/token-form-dialog-panel.tsx");
    const heading = read("src/components/tokens/token-form-dialog-heading.tsx");
    const css = readStylesheet();

    assert.match(dialog, /document\.querySelector\("\.library-shell"\)/);
    assert.match(dialog, /document\.body/);
    assert.match(dialog, /createPortal\(/);
    assert.match(dialog, /className="share-backdrop"/);
    assert.match(dialog, /onClick=\{onClose\}/);
    assert.match(dialog, /role="presentation"/);
    assert.match(panel, /role="dialog"/);
    assert.match(panel, /aria-modal="true"/);
    assert.match(panel, /aria-labelledby=\{titleId\}/);
    assert.match(panel, /className="share-dialog token-form-dialog"/);
    assert.match(panel, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/);
    assert.match(panel, /querySelector\("\.share-backdrop"\)/);
    assert.ok(
      panel.indexOf('querySelector(".share-backdrop")') < panel.indexOf('event.key === "Escape"'),
    );
    assert.match(panel, /event\.key === "Escape"/);
    assert.match(panel, /event\.key !== "Tab"/);
    assert.match(panel, /button, input, select, textarea, a/);
    assert.match(panel, /previous\?\.focus\(\)/);
    assert.match(heading, /<h2 id=\{titleId\}>\{title\}<\/h2>/);
    assert.match(heading, /Cancel/);
    assert.doesNotMatch(heading, /<button/);
    assert.match(css, /\.library-shell \.token-form-dialog \{[^}]*width: min\(520px, 100%\)/);
    assert.match(css, /\.library-shell \.token-form-dialog \{[^}]*overflow: auto/);
    assert.doesNotMatch(css, /\.library-shell \.token-create \{\s*display: contents/);
    assert.doesNotMatch(css, /\.library-shell \.token-form \{\s*flex: 1 1 100%/);
  });
});
