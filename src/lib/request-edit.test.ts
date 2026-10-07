import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

describe("edit icon on a view-only link", () => {
  it("keeps the icon on the document tools for someone who cannot edit", () => {
    const page = read("src/app/d/[id]/page.tsx");
    const screen = read("src/components/document-screen.tsx");
    const gate = read("src/components/document/request-edit.tsx");
    const tools = screen.slice(screen.indexOf("topbar-tools"), screen.indexOf("editor-shell"));

    assert.match(page, /signedIn=\{Boolean\(user\)\}/);
    assert.match(tools, /<RequestEdit canEdit=\{canEdit\} id=\{id\} signedIn=\{signedIn\} \/>/);
    assert.equal(/\{canEdit \? \(/.test(tools), false);
    assert.match(gate, /if \(canEdit\) return null/);
    assert.match(
      gate,
      /signedIn \? <RequestEditButton id=\{id\} \/> : <RequestEditLogin id=\{id\} \/>/,
    );
  });

  it("sends a signed-in viewer to require permissions and an anonymous viewer to login", () => {
    const button = read("src/components/document/request-edit-button.tsx");
    const login = read("src/components/document/request-edit-login.tsx");
    const request = read("src/lib/permission-request.ts");

    assert.match(button, /useMutation/);
    assert.match(button, /mutation\.isPending/);
    assert.match(button, /method: "POST"/);
    const status = read("src/components/document/request-edit-status.tsx");

    assert.match(button, /Require permissions/);
    assert.match(button, /Request sent/);
    assert.match(button, /<RequestEditStatus message=\{message\} sent=\{sent\} \/>/);
    assert.match(status, /The owner has this request\./);
    assert.match(status, /<Alert>\{message\}<\/Alert>/);
    assert.doesNotMatch(button, /useState/);
    assert.match(button, /<Button/);
    assert.equal(/<button/.test(button), false);

    assert.match(login, /href=\{`\/login\?next=\/d\/\$\{id\}`\}/);
    assert.match(login, /visually-hidden">Login/);
    assert.doesNotMatch(login, /permission-request/);
    assert.equal(/<button/.test(login), false);

    assert.match(request, /if \(access\.level === "edit"\) throw new HttpError\(409/);
    assert.doesNotMatch(request, /access\.level !== "none"/);
  });
});
