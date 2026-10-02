import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("private document permission request", () => {
  it("emails the owner once, without the document body, and keeps a unique request row", () => {
    const mail = read("src/lib/mail.ts");
    const request = read("src/lib/permission-request.ts");
    const route = read("src/app/api/documents/[id]/permission-request/route.ts");
    const schema = read("src/db/schema.ts");
    const migration = read("drizzle/0005_document-permission-request.sql");
    const journal = read("drizzle/meta/_journal.json");
    const contentRoute = read("src/app/api/documents/[id]/route.ts");

    const inviteAt = mail.indexOf("export async function sendWorkspaceInvite");
    const permissionAt = mail.indexOf("export async function sendDocumentPermissionRequest");
    const permission = mail.slice(
      permissionAt,
      mail.indexOf("export async function sendSupportRequest"),
    );
    const sendAt = request.indexOf("await sendDocumentPermissionRequest");
    const conflictAt = request.indexOf("onConflictDoNothing");
    const ownerMissAt = request.indexOf("The owner has no email address");
    const insertAt = request.indexOf(".insert(documentPermissionRequests)");

    assert.ok(inviteAt > 0);
    assert.ok(permissionAt > inviteAt);
    assert.match(permission, /deliverEmail/);
    assert.match(permission, /requesterEmail/);
    assert.match(permission, /documentTitle/);
    assert.match(permission, /url/);
    assert.doesNotMatch(permission, /content/);
    assert.doesNotMatch(permission, /passwordHash/);

    assert.match(request, /eq\(documents\.id, documentId\)/);
    assert.match(request, /HttpError\(404, "Document not found"\)/);
    assert.match(request, /from\(user\)/);
    assert.match(request, /eq\(user\.id, document\.ownerId\)/);
    assert.match(request, /The owner has no email address/);
    assert.match(request, /appBaseUrl\(\)/);
    assert.match(request, /\/d\/\$\{documentId\}/);
    assert.doesNotMatch(request, /content: documents\.content/);
    assert.ok(ownerMissAt < insertAt);
    assert.ok(conflictAt < sendAt);
    assert.match(request.slice(conflictAt, sendAt), /if \(!inserted\) return \{ requested: true/);

    assert.match(route, /requireLibraryUser\(\)/);
    assert.match(route, /readDocumentPermissionRequest/);
    assert.match(route, /requestDocumentPermission/);
    assert.doesNotMatch(route, /document\.content/);

    assert.match(schema, /document_permission_request/);
    assert.match(
      schema,
      /uniqueIndex\("document_permission_request_document_requester_idx"\)\.on\(\s*table\.documentId,\s*table\.requesterId,/,
    );
    assert.match(migration, /CREATE TABLE "document_permission_request"/);
    assert.match(
      migration,
      /CREATE UNIQUE INDEX "document_permission_request_document_requester_idx"/,
    );
    assert.match(migration, /"document_id","requester_id"/);
    assert.match(journal, /"tag": "0005_document-permission-request"/);

    assert.match(contentRoute, /Document not found/);
    assert.doesNotMatch(contentRoute, /permission-request/);
  });

  it("shows a login gate to anonymous viewers and a one-shot request to signed-in viewers", () => {
    const page = read("src/app/d/[id]/page.tsx");
    const gate = read("src/components/document/private-document.tsx");
    const signIn = read("src/components/document/private-sign-in.tsx");
    const request = read("src/components/document/request-permissions.tsx");
    const preview = read("src/lib/share-preview.ts");

    assert.match(page, /if \(!bundle\) notFound\(\)/);
    assert.doesNotMatch(page, /if \(access\.level === "none"\) notFound\(\)/);
    assert.match(
      page,
      /<PrivateDocument id=\{id\} signedIn=\{Boolean\(user\)\} type=\{documentType\} \/>/,
    );
    assert.doesNotMatch(page, /<PrivateDocument[^>]*content=/);

    assert.match(gate, /<Page className="library-main">/);
    assert.match(
      gate,
      /signedIn \? <RequestPermissions id=\{id\} \/> : <PrivateSignIn id=\{id\} type=\{type\} \/>/,
    );
    assert.doesNotMatch(gate, /permission-request/);

    assert.match(signIn, /Login to view private note/);
    assert.match(signIn, /Login to view private diagram/);
    assert.match(signIn, /This document is private\./);
    assert.match(signIn, /\/login\?next=\/d\/\$\{id\}/);
    assert.match(signIn, /Continue with email/);
    assert.doesNotMatch(signIn, /Request permissions/);

    assert.match(request, /title="Request permissions"/);
    assert.match(request, /useMutation/);
    assert.match(request, /mutation\.isPending/);
    assert.match(request, /mutation\.error/);
    assert.match(request, /method: "POST"/);
    assert.match(request, /Request sent/);
    assert.doesNotMatch(request, /useState/);
    assert.doesNotMatch(request, /document\.content|body\.content/);

    assert.match(preview, /document\?\.visibility === "public" && document\.type === "note"/);
  });
});
