import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("video embed file panel", () => {
  it("commits a video url on submit without an embed button", () => {
    const tab = read("../components/note/note-video-embed-tab.tsx");

    assert.match(tab, /submitButton=\{<ScreenReaderOnlySubmit \/>\}/);
    assert.match(tab, /filenameFromURL\(currentURL\)/);
    assert.match(tab, /url: currentURL/);
    assert.equal(tab.includes("FilePanel.Button"), false);
    assert.equal(tab.includes("Embed video"), false);
    assert.equal(/<button/.test(tab), false);
  });

  it("replaces only the video panel and leaves other file blocks on the default panel", () => {
    const panel = read("../components/note/note-file-panel.tsx");
    const surface = read("../components/note/note-editor-surface.tsx");

    assert.match(panel, /block\?\.type !== "video"/);
    assert.match(panel, /<FilePanel blockId=\{blockId\} \/>/);
    assert.match(panel, /<NoteVideoEmbedTab blockId=\{blockId\} \/>/);
    assert.match(panel, /dict\.file_panel\.embed\.title/);
    assert.equal(/"image"|"audio"|"file"/.test(panel), false);
    assert.match(surface, /filePanel=\{false\}/);
    assert.match(surface, /<FilePanelController filePanel=\{NoteFilePanel\} \/>/);
  });
});
