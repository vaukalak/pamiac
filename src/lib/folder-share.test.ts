import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolveInheritedAccess, type ShareGrant } from "./access.ts";
import { presentListedFolder, presentSharedFolder } from "./folder-library.ts";
import { prepareShareCredentials } from "./share-update.ts";

const viewer = {
  isOwner: false,
  workspaceMember: false,
  viewerEmail: null as string | null,
};

function grant(partial: Partial<ShareGrant> & Pick<ShareGrant, "id" | "visibility">): ShareGrant {
  return {
    kind: "folder",
    allowedEmails: [],
    passwordOk: false,
    ...partial,
  };
}

describe("folder share access", () => {
  it("lets a public folder open a private document that lives inside it", () => {
    const access = resolveInheritedAccess({
      ...viewer,
      grants: [
        grant({ id: "doc", kind: "document", visibility: "private" }),
        grant({ id: "folder", visibility: "public" }),
      ],
    });
    assert.deepEqual(access, { level: "view", reason: "public" });
  });

  it("keeps a password folder locked until that folder cookie matches", () => {
    const locked = resolveInheritedAccess({
      ...viewer,
      grants: [
        grant({ id: "doc", kind: "document", visibility: "private" }),
        grant({ id: "folder", visibility: "password", passwordOk: false }),
      ],
    });
    assert.deepEqual(locked, {
      level: "locked",
      reason: "password",
      unlockId: "folder",
      unlockKind: "folder",
    });
    const open = resolveInheritedAccess({
      ...viewer,
      grants: [
        grant({ id: "doc", kind: "document", visibility: "private" }),
        grant({ id: "folder", visibility: "password", passwordOk: true }),
      ],
    });
    assert.deepEqual(open, { level: "view", reason: "password" });
  });

  it("requires the listed email on an emails folder", () => {
    const grants = [
      grant({ id: "doc", kind: "document", visibility: "private" }),
      grant({
        id: "folder",
        visibility: "emails",
        allowedEmails: ["ada@example.com"],
      }),
    ];
    assert.equal(resolveInheritedAccess({ ...viewer, grants }).reason, "login");
    assert.equal(
      resolveInheritedAccess({
        ...viewer,
        viewerEmail: "other@example.com",
        grants,
      }).reason,
      "email",
    );
    assert.equal(
      resolveInheritedAccess({
        ...viewer,
        viewerEmail: "Ada@Example.com",
        grants,
      }).level,
      "view",
    );
  });

  it("stops inheriting once the document leaves the folder", () => {
    const inside = resolveInheritedAccess({
      ...viewer,
      grants: [
        grant({ id: "doc", kind: "document", visibility: "private" }),
        grant({ id: "folder", visibility: "public" }),
      ],
    });
    const outside = resolveInheritedAccess({
      ...viewer,
      grants: [grant({ id: "doc", kind: "document", visibility: "private" })],
    });
    assert.equal(inside.level, "view");
    assert.equal(outside.level, "none");
  });

  it("prefers a password lock over login when both remain", () => {
    const access = resolveInheritedAccess({
      ...viewer,
      grants: [
        grant({ id: "doc", kind: "document", visibility: "password" }),
        grant({
          id: "folder",
          visibility: "emails",
          allowedEmails: ["ada@example.com"],
        }),
      ],
    });
    assert.deepEqual(access, {
      level: "locked",
      reason: "password",
      unlockId: "doc",
      unlockKind: "document",
    });
  });

  it("lets a workspace member edit and lets the document's own public share beat a locked folder", () => {
    assert.equal(
      resolveInheritedAccess({
        ...viewer,
        workspaceMember: true,
        grants: [
          grant({ id: "doc", kind: "document", visibility: "private" }),
          grant({ id: "folder", visibility: "private" }),
        ],
      }).level,
      "edit",
    );
    assert.equal(
      resolveInheritedAccess({
        ...viewer,
        grants: [
          grant({ id: "doc", kind: "document", visibility: "public" }),
          grant({ id: "folder", visibility: "password" }),
        ],
      }).level,
      "view",
    );
  });

  it("uses a login lock when that is the only remaining gate", () => {
    const access = resolveInheritedAccess({
      ...viewer,
      grants: [
        grant({
          id: "folder",
          visibility: "emails",
          allowedEmails: ["ada@example.com"],
        }),
        grant({
          id: "parent",
          visibility: "emails",
          allowedEmails: ["ada@example.com"],
        }),
      ],
    });
    assert.equal(access.level, "locked");
    if (access.level === "locked") {
      assert.equal(access.reason, "login");
      assert.equal(access.unlockId, "folder");
    }
  });

  it("does not let a folder share grant edit", () => {
    const access = resolveInheritedAccess({
      ...viewer,
      grants: [
        grant({ id: "doc", kind: "document", visibility: "private" }),
        grant({ id: "folder", visibility: "public" }),
      ],
    });
    assert.equal(access.level, "view");
    assert.equal(
      resolveInheritedAccess({
        ...viewer,
        isOwner: true,
        grants: [grant({ id: "doc", kind: "document", visibility: "private" })],
      }).level,
      "edit",
    );
  });

  it("rejects an empty email list and a short password", () => {
    assert.throws(
      () =>
        prepareShareCredentials({
          visibility: "emails",
          emails: ["  "],
          currentPasswordHash: null,
        }),
      /Add at least one email address/,
    );
    assert.throws(
      () =>
        prepareShareCredentials({
          visibility: "password",
          password: "abc",
          currentPasswordHash: null,
        }),
      /Password must be at least 4 characters/,
    );
    const kept = prepareShareCredentials({
      visibility: "password",
      currentPasswordHash: "salt:hash",
    });
    assert.equal(kept.passwordHash, "salt:hash");
  });

  it("leaves the document visibility column out of a folder share write", () => {
    const source = readFileSync(new URL("./folders.ts", import.meta.url), "utf8");
    const update = source.slice(
      source.indexOf("export async function updateFolderShare"),
      source.indexOf("async function selectFolders"),
    );
    assert.match(update, /visibleFolder\(userId, id\)/);
    assert.match(update, /prepareShareCredentials\(/);
    assert.match(update, /\.update\(folders\)/);
    assert.equal(update.includes("documents"), false);
    assert.match(update, /sendFolderShared\(/);
    assert.match(update, /inArray\(folderShares\.email, pending\)/);
  });

  it("presents folder links as /f/<id> for list and share", () => {
    assert.deepEqual(
      presentListedFolder(
        {
          id: "folder-1",
          name: "Notes",
          parentId: null,
          workspaceId: null,
          visibility: "public",
        },
        "https://pamiac.test",
      ),
      {
        id: "folder-1",
        name: "Notes",
        parentId: null,
        workspaceId: null,
        visibility: "public",
        url: "https://pamiac.test/f/folder-1",
      },
    );
    assert.equal(
      presentSharedFolder(
        {
          id: "folder-1",
          name: "Notes",
          visibility: "emails",
          emails: ["ada@example.com"],
          hasPassword: false,
        },
        "https://pamiac.test",
      ).url,
      "https://pamiac.test/f/folder-1",
    );
  });

  it("registers list_folders and share_folder on the agent scope", () => {
    const server = readFileSync(new URL("./mcp-server.ts", import.meta.url), "utf8");
    const listRoute = readFileSync(
      new URL("../app/api/agent/v1/folders/route.ts", import.meta.url),
      "utf8",
    );
    const shareRoute = readFileSync(
      new URL("../app/api/agent/v1/folders/[id]/share/route.ts", import.meta.url),
      "utf8",
    );
    assert.match(server, /"list_folders"/);
    assert.match(server, /listAgentFolders\(userId, scope\)/);
    assert.match(server, /"share_folder"/);
    assert.match(server, /updateFolderShare\(/);
    assert.match(server, /errorResult\(failureMessage\(error\)\)/);
    assert.match(listRoute, /requireAgentUser\(request\)/);
    assert.match(listRoute, /presentListedFolder\(row, origin\(request\)\)/);
    assert.match(shareRoute, /requireAgentUser\(request\)/);
    assert.match(shareRoute, /scope: agent\.scope/);
    const page = readFileSync(new URL("../app/d/[id]/page.tsx", import.meta.url), "utf8");
    assert.match(page, /folderGrantChain\(bundle\.document\.folderId\)/);
    assert.match(page, /resolveInheritedAccess\(/);
    const modal = readFileSync(
      new URL("../components/share/share-modal.tsx", import.meta.url),
      "utf8",
    );
    assert.match(modal, /\/api\/folders\/\$\{id\}\/share/);
    const link = readFileSync(
      new URL("../components/share/share-link.tsx", import.meta.url),
      "utf8",
    );
    const locked = readFileSync(
      new URL("../components/locked-document.tsx", import.meta.url),
      "utf8",
    );
    const folderPage = readFileSync(new URL("../app/f/[id]/page.tsx", import.meta.url), "utf8");
    assert.match(link, /\$\{path\}\/\$\{id\}/);
    assert.match(locked, /\/api\/folders\/\$\{unlockId\}\/unlock/);
    assert.match(folderPage, /nextPath=\{\`\/f\/\$\{id\}\`\}/);
    const none = folderPage.slice(
      folderPage.indexOf('access.level === "none"'),
      folderPage.indexOf('access.level === "locked"'),
    );
    assert.equal(none.includes("bundle.folder.name"), false);
  });
});
