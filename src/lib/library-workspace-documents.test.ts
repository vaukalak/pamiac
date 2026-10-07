import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function expect(actual: unknown) {
  const text = String(actual);
  return {
    toBe(expected: unknown) {
      assert.equal(actual, expected);
    },
    toMatch(pattern: RegExp) {
      assert.match(text, pattern);
    },
    toBeGreaterThan(expected: number) {
      assert.equal(typeof actual, "number");
      assert.ok(Number(actual) > expected, `${String(actual)} > ${expected}`);
    },
    not: {
      toMatch(pattern: RegExp) {
        assert.doesNotMatch(text, pattern);
      },
      toBe(expected: unknown) {
        assert.notEqual(actual, expected);
      },
    },
  };
}

function slice(source: string, start: string, end: string) {
  const from = source.indexOf(start);
  assert.ok(from >= 0, start);
  const to = source.indexOf(end, from + start.length);
  assert.ok(to > from, end);
  return source.slice(from, to);
}

function librarySource() {
  const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
  return slice(store, "export async function listLibraryDocuments", "function createdLibraryId");
}

function sharedWhere(library: string) {
  const where = slice(library, ".where(", ".orderBy(asc(documents.sortIndex)");
  return where;
}

describe("workspace documents in the human library", () => {
  it("adds another owner's workspace document for a member of that workspace", () => {
    const library = librarySource();
    const where = sharedWhere(library);

    expect(library).toMatch(/const shared = await getDb\(\)/);
    expect(library).toMatch(/const rows = \[\.\.\.owned, \.\.\.shared\]/);
    expect(where).toMatch(/eq\(documents\.visibility, "workspace"\)/);
    expect(where).toMatch(/isNotNull\(documents\.workspaceId\)/);
    expect(where).toMatch(/ne\(documents\.ownerId, ownerId\)/);
    expect(where).toMatch(/exists\(/);
    expect(where).toMatch(/eq\(workspaceMembers\.workspaceId, documents\.workspaceId\)/);
    expect(where).toMatch(/eq\(workspaceMembers\.userId, ownerId\)/);
    expect(where).not.toMatch(/\bor\(/);
    expect(where).not.toMatch(/documents\.type/);
  });

  it("still lists the owner's own documents when they are not visibility workspace", () => {
    const store = readFileSync(new URL("./documents.ts", import.meta.url), "utf8");
    const owned = slice(
      store,
      "export async function listDocuments",
      "function agentDocumentWhere",
    );
    const library = librarySource();

    expect(library).toMatch(/const owned = await listDocuments\(ownerId\)/);
    expect(library).toMatch(/const rows = \[\.\.\.owned, \.\.\.shared\]/);
    expect(owned).toMatch(/\.where\(eq\(documents\.ownerId, ownerId\)\)/);
    expect(owned).not.toMatch(/visibility/);
    expect(owned).not.toMatch(/workspaceMembers/);
  });

  it("does not add the workspace document for someone who is not a member", () => {
    const where = sharedWhere(librarySource());

    expect(where).toMatch(/and\(/);
    expect(where).toMatch(
      new RegExp(
        "exists\\(\\s*getDb\\(\\)\\s*" +
          "\\.select\\(\\{ id: workspaceMembers\\.id \\}\\)\\s*" +
          "\\.from\\(workspaceMembers\\)",
      ),
    );
    expect(where).toMatch(/eq\(workspaceMembers\.userId, ownerId\)/);
    expect(where).toMatch(/eq\(workspaceMembers\.workspaceId, documents\.workspaceId\)/);
    expect(where).not.toMatch(/workspaceInvites/);
    expect(where).not.toMatch(/\bor\(/);
    expect(where.indexOf("exists(")).toBeGreaterThan(
      where.indexOf('eq(documents.visibility, "workspace")'),
    );
  });

  it("does not add private, public, password, or emails documents for other members", () => {
    const where = sharedWhere(librarySource());

    expect(where).toMatch(/eq\(documents\.visibility, "workspace"\)/);
    expect((where.match(/documents\.visibility/g) ?? []).length).toBe(1);
    expect(where).not.toMatch(/"private"|"public"|"password"|"emails"/);
    expect(where).not.toMatch(/\bor\(/);
  });

  it("keeps workspaceId on the shared row so it stays out of the personal library", () => {
    const library = librarySource();
    const mapped = library.slice(library.indexOf("return rows.map"));

    expect(library).toMatch(/isNotNull\(documents\.workspaceId\)/);
    expect(mapped).toMatch(/workspaceId: row\.workspaceId/);
    expect(mapped).not.toMatch(/workspaceId: null/);
    expect(library).not.toMatch(/\.set\(\{[^}]*workspaceId/);
    expect(library).not.toMatch(/updateShare/);
  });

  it("includes documentShares emails on the shared row", () => {
    const library = librarySource();
    const mapped = library.slice(library.indexOf("return rows.map"));

    expect(library).toMatch(
      /from\(documentShares\)\.where\(inArray\(documentShares\.documentId, ids\)\)/,
    );
    expect(library).toMatch(/current\.push\(share\.email\)/);
    expect(mapped).toMatch(/emails: emails\.get\(row\.id\) \?\? \[\]/);
    expect(mapped).not.toMatch(/emails: \[\]/);
  });

  it("does not list the owner's own visibility workspace document twice", () => {
    const library = librarySource();
    const where = sharedWhere(library);

    expect(where).toMatch(/ne\(documents\.ownerId, ownerId\)/);
    expect(library).toMatch(/const rows = \[\.\.\.owned, \.\.\.shared\]/);
    expect(library).not.toMatch(/\[\.\.\.shared, \.\.\.owned, \.\.\.shared\]/);
    expect((library.match(/from\(documents\)/g) ?? []).length).toBe(1);
  });
});
