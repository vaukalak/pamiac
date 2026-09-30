import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("library dashboard chrome risks", () => {
  it("titles the personal library Personal and a named space from the member list", () => {
    const board = read("../components/library/document-board.tsx");
    const title = board.slice(
      board.indexOf("function spaceTitle"),
      board.indexOf("export function DocumentBoard"),
    );

    assert.match(title, /PERSONAL_SPACE_ID\) return "Personal"/);
    assert.match(title, /openWorkspaceName\(workspaceId, workspaces\)/);
  });

  it("counts the open space before search narrows the cards", () => {
    const board = read("../components/library/document-board.tsx");

    const countsAt = board.indexOf("const counts = libraryTypeCounts(library)");
    const filterAt = board.indexOf("libraryQueryMatches(item.title");

    assert.match(board, /const counts = libraryTypeCounts\(library\)/);
    assert.ok(countsAt > 0 && countsAt < filterAt);
    assert.match(board, /searchForm\.reset\(\{ query: "" \}\)/);
  });

  it("draws a diagram sketch from stored node names and keeps note text", () => {
    const sketch = read("../components/library/document-diagram-sketch.tsx");
    const preview = read("../components/library/document-card-preview.tsx");
    const meta = read("../components/library/document-card-meta.tsx");
    const foot = read("../components/library/document-card-foot.tsx");

    assert.match(sketch, /readDiagram\(content\)/);
    assert.match(sketch, /diagram\.nodes\.length === 0\) return <p>Empty diagram<\/p>/);
    assert.match(sketch, /node\.name/);
    assert.equal(/User input|Planner|Synthesis/.test(sketch), false);
    assert.match(preview, /documentPreview\(document\.type, document\.content\)/);
    assert.match(meta, /document\.type === "note" \? "NOTE" : "DIAGRAM"/);
    assert.match(foot, /Edited \{editedLabel\(document\.updatedAt\)\}/);
    assert.match(foot, /private: "Only me"/);
    assert.match(foot, /public: "Public"/);
    assert.match(foot, /emails: "Email"/);
    assert.match(foot, /password: "Password"/);
  });

  it("offers invite only for a managed workspace and keeps support and the account email", () => {
    const rail = read("../components/library/library-rail-links.tsx");
    const panel = read("../components/header/profile-menu-panel.tsx");
    const board = read("../components/library/document-board.tsx");
    const sidebar = read("../components/library/library-sidebar.tsx");
    const nav = read("../components/library/library-nav.tsx");

    assert.match(rail, /\{managing \? <LibraryInviteLink onInvite=\{onManage\} \/> : null\}/);
    assert.match(rail, /href="\/support"/);
    assert.match(board, /<ProfileMenu email=\{email\} \/>/);
    assert.match(panel, /className="profile-email"/);
    assert.match(panel, /\{email\}/);
    assert.equal(/LibraryAccount|library-account/.test(sidebar + board), false);
    assert.equal(/Shared with me|Settings/.test(nav + rail + sidebar), false);
    assert.match(nav, /\["all", "Overview"\]/);
    assert.match(nav, /\["note", "Notes"\]/);
    assert.match(nav, /\["diagram", "Diagrams"\]/);
  });

  it("keeps the member email in the form instead of component state", () => {
    const member = read("../components/library/workspace-member-add.tsx");

    assert.match(member, /useForm<MemberValues>/);
    assert.match(member, /<Form\.Input/);
    assert.match(member, /name="email"/);
    assert.equal(/useState/.test(member), false);
    assert.equal(/<input/.test(member), false);
  });
});
