import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("new folder in the create menu", () => {
  it("keeps the heading on Create and Connect, without a third pill", () => {
    const actions = read("../components/library/library-heading-actions.tsx");
    const css = read("../app/globals.css");
    const createIndex = actions.indexOf("<LibraryCreate");
    const connectIndex = actions.indexOf("<LibraryConnectLink");

    assert.match(actions, /<LibraryCreate workspaceId=\{workspaceId\} \/>/);
    assert.match(actions, /<LibraryConnectLink className="btn secondary library-connect" \/>/);
    assert.ok(createIndex >= 0 && connectIndex > createIndex);
    assert.equal(/LibraryCreateFolder|library-folder-plus|New folder/.test(actions), false);
    assert.equal(/library-folder-plus/.test(css), false);
    assert.throws(() => read("../components/library/library-create-folder.tsx"));
  });

  it("creates a folder in the current location from the Create menu", () => {
    const create = read("../components/library/library-create.tsx");
    const item = read("../components/library/library-create-folder-item.tsx");
    const form = read("../components/library/library-create-folder-form.tsx");

    assert.match(create, /<LibraryCreateFolderItem/);
    assert.match(create, /onCreated=\{close\}/);
    assert.match(item, /New folder/);
    assert.match(item, /useLibraryLocation\(\)/);
    assert.match(item, /parentId=\{folderId\}/);
    assert.match(item, /workspaceId=\{workspaceId\}/);
    assert.match(item, /<LibraryCreateFolderForm/);
    assert.equal(/<details|<summary/.test(item), false);
    assert.match(form, /fetch\("\/api\/folders"/);
    assert.match(form, /JSON\.stringify\(\{ name, workspaceId, parentId \}\)/);
    assert.match(form, /folderName\(values\.name\)/);
    assert.match(form, /<Form\.Input label="Name" name="name" type="text" \/>/);
    assert.equal(/<input/.test(form), false);
  });

  it("hides the name form when the Create menu closes", () => {
    const item = read("../components/library/library-create-folder-item.tsx");

    assert.match(item, /addEventListener\("toggle", onToggle\)/);
    assert.match(item, /if \(!menu\.open\) setNaming\(false\)/);
  });
});
