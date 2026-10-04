import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readStylesheet } from "./stylesheet.ts";

const css = readStylesheet();
const board = readFileSync(
  new URL("../components/home/circuit-board.tsx", import.meta.url),
  "utf8",
);

function expect(actual: string) {
  return {
    toMatch(pattern: RegExp) {
      assert.match(actual, pattern);
    },
    not: {
      toMatch(pattern: RegExp) {
        assert.doesNotMatch(actual, pattern);
      },
    },
  };
}

function mediaBlocks(source: string, query: string) {
  const header = `@media ${query}`;
  const blocks: string[] = [];
  let at = source.indexOf(header);
  assert.ok(at >= 0, header);
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
          break;
        }
      }
    }
    at = source.indexOf(header, at + header.length);
  }
  return blocks;
}

describe("library circuit framing", () => {
  it("keeps the login board filling one screen", () => {
    const home = css.slice(css.indexOf(".home {"), css.indexOf(".home ::selection"));
    const shared = css.slice(css.indexOf(".home-board {"), css.indexOf(".home-trace-base"));

    expect(home).toMatch(/min-height:\s*100vh/);
    expect(shared).toMatch(/position:\s*absolute/);
    expect(shared).toMatch(/inset:\s*0/);
    expect(shared).toMatch(/height:\s*100%/);
    expect(shared).not.toMatch(/position:\s*fixed/);
    expect(shared).not.toMatch(/100vh/);
    expect(board).toMatch(/preserveAspectRatio="xMidYMid slice"/);
    expect(board).toMatch(
      /viewBox=\{`0 0 \$\{CIRCUIT_VIEWBOX\.width\} \$\{CIRCUIT_VIEWBOX\.height\}`\}/,
    );
  });

  it("pins the signed-in board and dim to the viewport when the shell grows past one screen", () => {
    const wide = mediaBlocks(css, "(min-width: 761px)")[0];
    const frame =
      /\.library-shell > \.home-board,\s*\.library-shell::after\s*\{[^}]*position:\s*fixed;[^}]*height:\s*100vh;/;

    expect(wide).toMatch(frame);
    expect(wide).toMatch(
      /\.library-shell > \.home-board,\s*\.library-shell::after\s*\{[^}]*inset:\s*0 auto auto 0;/,
    );
    expect(wide).toMatch(
      /\.library-shell > \.home-board,\s*\.library-shell::after\s*\{[^}]*width:\s*100%;/,
    );
    expect(css).toMatch(
      /\.library-shell > \.library-main,\s*\.library-shell > \.library-status\s*\{[^}]*z-index:\s*1;/,
    );
    expect(css).toMatch(/\.library-shell > \.home-board\s*\{[^}]*z-index:\s*0;/);
  });

  it("does not pin the board on the narrow shell that is already one visual viewport", () => {
    const narrow = mediaBlocks(css, "(max-width: 760px)").join("\n");
    const wide = mediaBlocks(css, "(min-width: 761px)")[0];
    const outsideWide = css.replace(wide, "");

    expect(narrow).not.toMatch(/\.library-shell > \.home-board[^,{]*\{[^}]*position:\s*fixed/);
    expect(narrow).not.toMatch(/\.library-shell::after[^,{]*\{[^}]*height:\s*100vh/);
    expect(outsideWide).not.toMatch(
      /\.library-shell > \.home-board,\s*\.library-shell::after\s*\{[^}]*position:\s*fixed/,
    );
  });
});
