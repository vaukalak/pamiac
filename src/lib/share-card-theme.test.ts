import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { shareFont, sharePalette } from "../components/share-preview/share-palette.ts";
import { shareImageFonts } from "./share-image-fonts.ts";

const root = new URL("../../", import.meta.url);

function source(path: string) {
  return readFileSync(new URL(path, root), "utf8");
}

const shareSources = [
  "src/components/share-preview/share-card.tsx",
  "src/components/share-preview/note-share-card.tsx",
  "src/components/share-preview/note-share-line.tsx",
  "src/components/share-preview/share-wordmark.tsx",
  "src/components/share-preview/share-circuit.tsx",
  "src/components/share-preview/share-palette.ts",
  "src/lib/share-image-fonts.ts",
].map(source);

describe("share card theme", () => {
  it("uses the dark circuit palette instead of the cream desk card", () => {
    assert.deepEqual(sharePalette, {
      ground: "#07090a",
      text: "#eef3e8",
      soft: "#9fab9c",
      lime: "#b9f542",
      limeDeep: "#8ed42a",
      onLime: "#0a0f07",
      trace: "rgba(120, 170, 90, 0.34)",
      hair: "rgba(185, 245, 66, 0.55)",
    });
    assert.equal(shareFont, "Outfit");

    const painted = shareSources.join("\n");
    assert.equal(painted.includes("#f3efe4"), false);
    assert.equal(painted.includes("#0e6b66"), false);
    assert.equal(painted.includes("#1a1814"), false);
    assert.equal(painted.includes("#5e584e"), false);
    assert.equal(painted.includes("Fraunces"), false);
    assert.equal(painted.includes("var("), false);
    assert.equal(painted.includes('display: "grid"'), false);
    assert.equal(painted.includes("filter:"), false);
  });

  it("keeps the wordmark, lime rule, and body hierarchy on both cards", () => {
    const site = source("src/components/share-preview/share-card.tsx");
    const note = source("src/components/share-preview/note-share-card.tsx");
    const line = source("src/components/share-preview/note-share-line.tsx");
    const wordmark = source("src/components/share-preview/share-wordmark.tsx");

    assert.match(site, /<ShareWordmark size="display" \/>/);
    assert.match(site, /background: sharePalette\.lime/);
    assert.match(site, /color: sharePalette\.soft/);
    assert.match(site, /\{SHARE_APP_DESCRIPTION\}/);
    assert.match(site, /borderLeft: `6px solid \$\{sharePalette\.lime\}`/);
    assert.doesNotMatch(site, /sharePalette\.teal|sharePalette\.paper/);

    assert.match(note, /<ShareWordmark size="label" \/>/);
    assert.match(note, /color: sharePalette\.text/);
    assert.match(note, /background: sharePalette\.lime/);
    assert.match(note, /borderLeft: `6px solid \$\{sharePalette\.lime\}`/);
    assert.match(note, /<ShareCircuit \/>/);
    assert.match(site, /<ShareCircuit \/>/);

    assert.match(wordmark, /display \? sharePalette\.text : sharePalette\.lime/);
    assert.match(wordmark, /fontFamily: shareFont/);
    assert.match(line, /heading \? sharePalette\.text : sharePalette\.soft/);
    assert.match(line, /fontFamily: shareFont/);
  });

  it("loads Outfit 400 and 600 from static files and drops Fraunces", async () => {
    const regularPath = new URL("assets/Outfit-Regular.ttf", root);
    const semiboldPath = new URL("assets/Outfit-SemiBold.ttf", root);
    const fonts = await shareImageFonts();

    assert.equal(existsSync(regularPath), true);
    assert.equal(existsSync(semiboldPath), true);
    assert.equal(existsSync(new URL("assets/Fraunces-Regular.ttf", root)), false);
    assert.equal(existsSync(new URL("assets/Fraunces-SemiBold.ttf", root)), false);

    const outfitName = Buffer.from("Outfit", "utf16le").swap16();
    const frauncesName = Buffer.from("Fraunces", "utf16le").swap16();

    for (const path of [regularPath, semiboldPath]) {
      const bytes = readFileSync(path);
      assert.equal(bytes.subarray(0, 4).toString("hex"), "00010000");
      assert.equal(bytes.includes(outfitName), true);
      assert.equal(bytes.includes(frauncesName), false);
    }

    assert.deepEqual(
      fonts.map((font) => ({ name: font.name, style: font.style, weight: font.weight })),
      [
        { name: "Outfit", style: "normal", weight: 400 },
        { name: "Outfit", style: "normal", weight: 600 },
      ],
    );
    assert.equal(fonts[0].data.equals(readFileSync(regularPath)), true);
    assert.equal(fonts[1].data.equals(readFileSync(semiboldPath)), true);

    const license = source("assets/OFL.txt");
    assert.match(license, /Copyright 2021 The Outfit Project Authors/);
    assert.match(license, /SIL OPEN FONT LICENSE/);
    assert.equal(license.includes("Fraunces"), false);
  });

  it("draws the circuit behind the type with trace and lime strokes", () => {
    const circuit = source("src/components/share-preview/share-circuit.tsx");

    assert.match(circuit, /<svg/);
    assert.match(circuit, /position: "absolute"/);
    assert.match(circuit, /stroke=\{sharePalette\.trace\}/);
    assert.match(circuit, /stroke=\{sharePalette\.hair\}/);
    assert.match(circuit, /fill=\{sharePalette\.lime\}/);
    assert.match(circuit, /fill=\{sharePalette\.limeDeep\}/);
    assert.match(circuit, /fill=\{sharePalette\.onLime\}/);
    assert.doesNotMatch(circuit, /filter|display:\s*"grid"|var\(--/);
  });
});
