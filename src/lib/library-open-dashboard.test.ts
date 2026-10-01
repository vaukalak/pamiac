import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  OPEN_LIBRARY_PENDING,
  openLibraryServerSnapshot,
  publishOpenLibrary,
} from "./library-memory.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function block(source: string, start: string, end: string) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(from >= 0 && to > from, `${start} .. ${end}`);
  return source.slice(from, to);
}

describe("open workspace dashboard", () => {
  it("keeps the server snapshot distinct from a stored library id", () => {
    assert.equal(openLibraryServerSnapshot(), OPEN_LIBRARY_PENDING);
    assert.equal(OPEN_LIBRARY_PENDING, "\u0000");
    publishOpenLibrary();
  });

  it("opens the dashboard from settings and members without staying on that page", () => {
    const shell = read("../components/library/library-shell.tsx");
    const choose = block(shell, "function chooseWorkspace", "function onFilter");

    assert.match(choose, /window\.localStorage\.setItem\(OPEN_LIBRARY_KEY, nextId\)/);
    assert.match(choose, /router\.push\("\/workspace"\)/);
    assert.equal(/setWorkspaceId/.test(choose), false);
    assert.match(shell, /openLibraryId/);
  });

  it("opens the dashboard from connections", () => {
    const shell = read("../components/tokens/token-shell.tsx");
    const choose = block(shell, "function chooseWorkspace", "function chooseFilter");

    assert.match(choose, /window\.localStorage\.setItem\(OPEN_LIBRARY_KEY, nextId\)/);
    assert.match(choose, /router\.push\("\/workspace"\)/);
    assert.equal(/setWorkspaceId/.test(choose), false);
  });

  it("switches the dashboard in place and waits to paint a stored library", () => {
    const board = read("../components/library/document-board.tsx");
    const choose = block(board, "function chooseWorkspace", "function apply");

    assert.match(choose, /window\.localStorage\.setItem\(OPEN_LIBRARY_KEY, nextId\)/);
    assert.match(choose, /publishOpenLibrary\(\)/);
    assert.match(choose, /searchForm\.reset\(\{ query: "" \}\)/);
    assert.equal(/router\.push/.test(board), false);
    assert.equal(/useState\(PERSONAL_SPACE_ID\)/.test(board), false);
    assert.match(board, /useSyncExternalStore\(\s*subscribeOpenLibrary/);
    assert.match(board, /openLibraryServerSnapshot/);
    assert.match(board, /storedLibraryId !== OPEN_LIBRARY_PENDING/);
    assert.match(board, /workspaceId \? \(/);
    assert.match(board, /<Page className="library-main">\{null\}<\/Page>/);
  });

  it("still opens the dashboard from a document and after leaving or deleting", () => {
    const sidebar = read("../components/document/document-sidebar.tsx");
    const leave = read("../components/workspace-settings/workspace-settings-leave-actions.tsx");
    const remove = read("../components/workspace-settings/workspace-settings-delete-actions.tsx");

    assert.match(sidebar, /window\.localStorage\.setItem\(OPEN_LIBRARY_KEY, nextId\)/);
    assert.match(sidebar, /router\.push\("\/workspace"\)/);
    assert.match(leave, /PERSONAL_SPACE_ID/);
    assert.match(leave, /router\.push\("\/workspace"\)/);
    assert.match(remove, /PERSONAL_SPACE_ID/);
    assert.match(remove, /router\.push\("\/workspace"\)/);
  });
});
