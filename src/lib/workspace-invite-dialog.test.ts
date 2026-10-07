import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function block(source: string, header: string) {
  const at = source.indexOf(header);
  assert.ok(at >= 0, header);
  const open = source.indexOf("{", at);
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(at, index + 1);
    }
  }
  assert.fail(`unclosed ${header}`);
}

describe("workspace invite dialog", () => {
  it("keeps the invitee surface on the circuit palette without restyling member invites", () => {
    const css = readStylesheet();
    const members = read("../components/workspace-members/workspace-members-invite-dialog.tsx");
    const panel = read("../components/library/workspace-invite-panel.tsx");
    const surface = block(css, ".library-shell .workspace-invite-dialog {");
    const backdrop = block(css, ".library-shell .share-backdrop:has(.workspace-invite-dialog) {");
    const memberBackdrop = block(css, ".library-shell .workspace-invite-backdrop {");
    const title = block(css, ".library-shell .workspace-invite-dialog h2 {");
    const name = block(css, ".library-shell .workspace-invite-dialog .workspace-invite-name {");
    const accept = block(css, ".library-shell .workspace-invite-dialog .btn.library-lime {");
    const reject = block(css, ".library-shell .workspace-invite-dialog .btn.secondary {");
    const focus = block(css, ".library-shell .workspace-invite-dialog .btn:focus-visible {");
    const error = block(css, ".library-shell .workspace-invite-dialog .error {");

    assert.match(panel, /className="share-dialog workspace-invite-dialog"/);
    assert.match(members, /className="share-backdrop workspace-invite-backdrop"/);
    assert.equal(/workspace-invite-dialog/.test(members), false);
    assert.match(surface, /background:\s*var\(--home-menu\)/);
    assert.match(surface, /border:\s*1px solid var\(--home-hair-strong\)/);
    assert.match(surface, /border-radius:\s*20px/);
    assert.match(surface, /box-shadow:\s*var\(--home-shadow\)/);
    assert.match(surface, /font-family:\s*var\(--sans\)/);
    assert.match(backdrop, /background:\s*var\(--home-scrim\)/);
    assert.match(memberBackdrop, /background:\s*rgba\(0,\s*0,\s*0,\s*0\.55\)/);
    assert.match(title, /font-family:\s*var\(--sans\)/);
    assert.match(title, /font-weight:\s*700/);
    assert.match(name, /font-family:\s*var\(--sans\)/);
    assert.match(name, /color:\s*var\(--home-text\)/);
    assert.match(accept, /background:\s*var\(--home-lime\)/);
    assert.match(reject, /border-color:\s*var\(--home-hair-strong\)/);
    assert.match(focus, /outline:\s*2px solid var\(--home-lime\)/);
    assert.match(error, /color:\s*var\(--home-danger\)/);
    assert.equal(/\.workspace-invite-name\s*\{[^}]*serif/.test(css), false);
  });

  it("keeps accept and reject on the shared button with the same decisions", () => {
    const actions = read("../components/library/workspace-invite-actions.tsx");
    const heading = read("../components/library/workspace-invite-heading.tsx");
    const choice = read("../components/library/workspace-invite-choice.tsx");

    assert.match(actions, /className="library-lime"/);
    assert.match(actions, /className="secondary"/);
    assert.match(actions, /id="workspace-invite-accept"/);
    assert.match(actions, /"Accept"/);
    assert.match(actions, /"Reject"/);
    assert.match(actions, /mutation\.mutate\("accept"\)/);
    assert.match(actions, /mutation\.mutate\("reject"\)/);
    assert.match(heading, /className="ghost"/);
    assert.match(heading, /Workspace invitation/);
    assert.match(choice, /Join this workspace, or decline\./);
    assert.match(choice, /invite\.workspaceName/);
    assert.equal(/<button/.test(actions), false);
    assert.equal(/<button/.test(heading), false);
  });
});
