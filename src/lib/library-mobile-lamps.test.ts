import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

function read(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

function mediaParts(source: string, query: string) {
  const header = `@media ${query}`;
  let at = source.indexOf(header);
  const blocks: string[] = [];
  const spans: Array<{ start: number; end: number }> = [];
  while (at >= 0) {
    const open = source.indexOf("{", at);
    let depth = 0;
    for (let index = open; index < source.length; index += 1) {
      const character = source[index];
      if (character === "{") depth += 1;
      else if (character === "}") {
        depth -= 1;
        if (depth === 0) {
          blocks.push(source.slice(open + 1, index));
          spans.push({ start: at, end: index + 1 });
          break;
        }
      }
    }
    at = source.indexOf(header, at + header.length);
  }
  assert.ok(blocks.length > 0, header);
  return { blocks, spans };
}

describe("mobile library lamps", () => {
  it("hides pads and traveling pulses only on a narrow authenticated library shell", () => {
    const css = readStylesheet();
    const narrowParts = mediaParts(css, "(max-width: 760px)");
    const narrow = narrowParts.blocks.join("\n");
    const outside = narrowParts.spans
      .reduce((text, span, index, spans) => {
        const start = index === 0 ? 0 : spans[index - 1].end;
        text.push(css.slice(start, span.start));
        return text;
      }, [] as string[])
      .concat(css.slice(narrowParts.spans.at(-1)?.end ?? 0))
      .join("");
    const hide =
      /\.library-shell:not\(\.library-shell-solo\) \.home-pad,\s*\.library-shell:not\(\.library-shell-solo\) \.home-trace-glow,\s*\.library-shell:not\(\.library-shell-solo\) \.home-trace-pulse\s*\{\s*display:\s*none;\s*\}/;

    const withoutHide = narrow.replace(hide, "");

    assert.match(narrow, hide);
    assert.doesNotMatch(withoutHide, /\.home-pad[\s\S]{0,160}display:\s*none/);
    assert.doesNotMatch(withoutHide, /\.home-trace-(?:glow|pulse)[\s\S]{0,160}display:\s*none/);
    assert.equal(outside.includes("library-shell:not(.library-shell-solo) .home-pad"), false);
    assert.doesNotMatch(narrow, /\.home-trace-base/);
    assert.doesNotMatch(narrow, /\.library-shell-solo \.home-pad/);
    assert.doesNotMatch(narrow, /\.home \.home-pad/);
    assert.match(css, /\.home-pad\s*\{[^}]*animation:\s*home-pad-breathe/);
    assert.match(
      css,
      /\.home-trace-glow,\s*\.home-trace-pulse\s*\{[^}]*animation:\s*home-pulse-run/,
    );
    assert.match(css, /\.home-trace-base\s*\{[^}]*stroke:\s*var\(--home-trace\)/);
  });

  it("keeps the lamp classes on public home pages and solo document shells", () => {
    const authenticated = [
      read("../components/library/document-board.tsx"),
      read("../components/library/library-shell.tsx"),
      read("../components/tokens/token-shell.tsx"),
    ];
    const documentShell = read("../components/document/document-shell.tsx");
    const home = [
      read("../app/page.tsx"),
      read("../app/login/page.tsx"),
      read("../app/support/page.tsx"),
      read("../app/connect/agent/page.tsx"),
      read("../app/connect/google/page.tsx"),
    ];

    for (const source of authenticated) {
      assert.match(source, /className="library-shell"/);
      assert.doesNotMatch(source, /library-shell-solo/);
      assert.match(source, /<CircuitBoard \/>/);
    }
    assert.match(
      documentShell,
      /email !== null[\s\S]*\? "library-shell" : "library-shell library-shell-solo"/,
    );
    for (const source of home) {
      assert.match(source, /className="home"/);
      assert.match(source, /<CircuitBoard \/>/);
      assert.doesNotMatch(source, /library-shell/);
    }
  });
});
