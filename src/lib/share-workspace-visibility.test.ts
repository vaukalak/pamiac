import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { resolveAccess, VISIBILITIES } from "./access.ts";
import { shareUpdatedEvent } from "./analytics.ts";

const stranger = {
  isOwner: false,
  viewerEmail: null as string | null,
  allowedEmails: [] as string[],
  passwordOk: false,
};

describe("workspace visibility", () => {
  it("hides a workspace document from a non-member and still lets a member edit", () => {
    assert.equal(resolveAccess({ ...stranger, visibility: "workspace" }).level, "none");
    assert.equal(
      resolveAccess({ ...stranger, visibility: "workspace", workspaceMember: false }).level,
      "none",
    );
    assert.deepEqual(
      resolveAccess({ ...stranger, visibility: "workspace", workspaceMember: true }),
      { level: "edit", reason: "member" },
    );
    for (const visibility of ["private", "public", "password", "emails"] as const) {
      assert.equal(resolveAccess({ ...stranger, visibility, workspaceMember: true }).level, "edit");
    }
  });

  it("records a workspace share and keeps the visibility list on one enum", () => {
    assert.equal(VISIBILITIES.includes("workspace"), true);
    const event = shareUpdatedEvent({
      userId: "user-1",
      documentId: "doc-1",
      mode: "workspace",
    });
    assert.equal(event?.event, "share_updated");
    assert.deepEqual(event?.properties, { documentId: "doc-1", mode: "workspace" });

    const schema = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
    assert.equal((schema.match(/enum: VISIBILITIES/g) ?? []).length, 2);
    assert.equal(/enum: \["private", "public", "password", "emails"\]/.test(schema), false);
  });

  it("names the workspace from the library query and skips a blank name", () => {
    const mode = readFileSync(
      new URL("../components/share/share-workspace-mode.tsx", import.meta.url),
      "utf8",
    );
    const icon = readFileSync(
      new URL("../components/share/share-mode-icon.tsx", import.meta.url),
      "utf8",
    );
    const list = readFileSync(
      new URL("../components/share/share-mode-list.tsx", import.meta.url),
      "utf8",
    );

    assert.match(mode, /useQuery\(workspacesQueryOptions\(\)\)/);
    assert.match(mode, /openWorkspaceName\(workspaceId, workspaces\.data\)/);
    assert.match(mode, /if \(!workspaceName\) return null/);
    assert.match(mode, /title=\{`Anyone in \$\{workspaceName\}`\}/);
    assert.match(mode, /Everyone in that workspace can open it\./);
    assert.match(mode, /icon="people"/);
    assert.match(mode, /value="workspace"/);
    assert.match(list, /workspaceId \? <ShareWorkspaceMode workspaceId=\{workspaceId\} \/> : null/);
    assert.match(icon, /people:/);
    assert.equal(icon.includes('name: "globe" | "key" | "lock" | "mail"'), false);
    const people = icon.slice(icon.indexOf("people:"), icon.indexOf("} as const"));
    assert.equal(/lock:|mail:|key:|globe:/.test(people), false);
  });
});
