import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("new folder in the create menu", () => {
  it("keeps the heading on Create and Connect, without a third pill", () => {
    const actions = read("../components/library/library-heading-actions.tsx");
    const css = readStylesheet();

    assert.match(actions, /<LibraryCreate workspaceId=\{workspaceId\} \/>/);
    assert.match(actions, /<LibraryConnectLink className="btn secondary library-connect" \/>/);
    const createIndex = actions.indexOf("<LibraryCreate");
    const connectIndex = actions.indexOf("<LibraryConnectLink");
    assert.ok(createIndex >= 0 && connectIndex > createIndex);
    assert.equal(/LibraryCreateFolder|library-folder-plus|New folder/.test(actions), false);
    assert.equal(/library-folder-plus/.test(css), false);
    assert.throws(() => read("../components/library/library-create-folder.tsx"));
  });

  it("creates a folder in the current location from the Create menu", () => {
    const create = read("../components/library/library-create.tsx");
    const item = read("../components/library/library-create-folder-item.tsx");
    const dialog = read("../components/library/library-create-folder-dialog.tsx");
    const form = read("../components/library/library-create-folder-form.tsx");

    assert.match(create, /<LibraryCreateFolderItem/);
    assert.match(item, /New folder/);
    assert.equal(/<details|<summary/.test(item), false);
    assert.match(dialog, /useLibraryLocation\(\)/);
    assert.match(dialog, /parentId=\{folderId\}/);
    assert.match(dialog, /workspaceId=\{workspaceId\}/);
    assert.match(dialog, /<LibraryCreateFolderForm/);
    assert.match(form, /fetch\("\/api\/folders"/);
    assert.match(form, /JSON\.stringify\(\{ name, workspaceId, parentId \}\)/);
    assert.match(form, /folderName\(values\.name\)/);
    assert.match(form, /<Form\.Input label="Name" name="name" type="text" \/>/);
    assert.equal(/<input/.test(form), false);
  });

  it("opens a dialog from New folder instead of an inline name form", () => {
    const create = read("../components/library/library-create.tsx");
    const item = read("../components/library/library-create-folder-item.tsx");
    const portal = read("../components/library/library-create-folder-dialog-portal.tsx");
    const dialog = read("../components/library/library-create-folder-dialog.tsx");
    const panel = read("../components/library/library-create-folder-panel.tsx");
    const heading = read("../components/library/library-create-folder-heading.tsx");

    assert.match(create, /<LibraryCreateFolderItem[\s\S]*onOpen=\{close\}/);
    assert.match(item, /onOpen\(\)/);
    assert.match(item, /summary\.focus\(\)/);
    assert.match(item, /setOpen\(true\)/);
    assert.equal(/LibraryCreateFolderForm|setNaming|addEventListener\("toggle"/.test(item), false);
    assert.match(portal, /createPortal\(/);
    assert.match(portal, /querySelector\("\.library-shell"\)/);
    assert.match(dialog, /className="share-backdrop"/);
    assert.match(dialog, /onPointerDown=\{onClose\}/);
    assert.match(dialog, /onCreated=\{onClose\}/);
    assert.match(panel, /role="dialog"/);
    assert.match(panel, /aria-modal="true"/);
    assert.match(panel, /event\.stopPropagation\(\)/);
    assert.match(panel, /event\.key === "Escape"/);
    assert.match(panel, /input\[name="name"\]/);
    assert.match(panel, /previous\?\.focus\(\)/);
    assert.match(heading, /New folder/);
    assert.match(heading, /Cancel/);
    assert.match(read("../components/library/library-create-folder-form.tsx"), /Create folder/);
  });

  it("renders the folder dialog outside the Create menu", () => {
    const create = read("../components/library/library-create.tsx");
    const portal = read("../components/library/library-create-folder-dialog-portal.tsx");
    const menu = create.slice(create.indexOf("<details"), create.indexOf("</details>"));

    assert.equal(/LibraryCreateFolderDialog/.test(menu), false);
    assert.match(portal, /createPortal\(<LibraryCreateFolderDialog/);
  });
});
