import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { shareFont, sharePalette } from "../components/share-preview/share-palette.ts";
import { shareImageFonts } from "./share-image-fonts.ts";

const root = new URL("../../", import.meta.url);

function source(path: string) {
  return readFileSync(new URL(path, root), "utf8");
}

function tableTags(bytes: Buffer) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint16(4);
  const tags: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const record = 12 + index * 16;
    tags.push(
      String.fromCharCode(bytes[record], bytes[record + 1], bytes[record + 2], bytes[record + 3]),
    );
  }
  return tags;
}

function cmapHas(bytes: Buffer, letter: string) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tags = tableTags(bytes);
  const cmapIndex = tags.indexOf("cmap");
  assert.ok(cmapIndex >= 0);
  const cmapOffset = view.getUint32(12 + cmapIndex * 16 + 8);
  const encodingCount = view.getUint16(cmapOffset + 2);
  let subtable = -1;
  for (let index = 0; index < encodingCount; index += 1) {
    const record = cmapOffset + 4 + index * 8;
    const platform = view.getUint16(record);
    const encoding = view.getUint16(record + 2);
    if (platform === 3 && (encoding === 1 || encoding === 10)) {
      subtable = cmapOffset + view.getUint32(record + 4);
    }
  }
  assert.ok(subtable >= 0);
  const format = view.getUint16(subtable);
  const code = letter.codePointAt(0) ?? 0;
  if (format !== 4) return false;
  const segCount = view.getUint16(subtable + 6) / 2;
  const endCode = subtable + 14;
  const startCode = endCode + segCount * 2 + 2;
  const idDelta = startCode + segCount * 2;
  const idRangeOffset = idDelta + segCount * 2;
  for (let segment = 0; segment < segCount; segment += 1) {
    const end = view.getUint16(endCode + segment * 2);
    const start = view.getUint16(startCode + segment * 2);
    if (code < start || code > end) continue;
    const rangeOffset = view.getUint16(idRangeOffset + segment * 2);
    if (rangeOffset === 0) return ((code + view.getUint16(idDelta + segment * 2)) & 0xffff) !== 0;
    const glyphOffset = idRangeOffset + segment * 2 + rangeOffset + (code - start) * 2;
    return view.getUint16(glyphOffset) !== 0;
  }
  return false;
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
    const cyrillicRegularPath = new URL("assets/Manrope-Regular.ttf", root);
    const cyrillicSemiboldPath = new URL("assets/Manrope-SemiBold.ttf", root);
    const fonts = await shareImageFonts();

    assert.equal(existsSync(regularPath), true);
    assert.equal(existsSync(semiboldPath), true);
    assert.equal(existsSync(cyrillicRegularPath), true);
    assert.equal(existsSync(cyrillicSemiboldPath), true);
    assert.equal(existsSync(new URL("assets/Fraunces-Regular.ttf", root)), false);
    assert.equal(existsSync(new URL("assets/Fraunces-SemiBold.ttf", root)), false);

    const outfitName = Buffer.from("Outfit", "utf16le").swap16();
    const manropeName = Buffer.from("Manrope", "utf16le").swap16();
    const frauncesName = Buffer.from("Fraunces", "utf16le").swap16();

    for (const path of [regularPath, semiboldPath]) {
      const bytes = readFileSync(path);
      assert.equal(bytes.subarray(0, 4).toString("hex"), "00010000");
      assert.equal(bytes.includes(outfitName), true);
      assert.equal(bytes.includes(frauncesName), false);
    }

    for (const path of [cyrillicRegularPath, cyrillicSemiboldPath]) {
      const bytes = readFileSync(path);
      assert.equal(bytes.subarray(0, 4).toString("hex"), "00010000");
      assert.equal(bytes.includes(manropeName), true);
      assert.equal(bytes.includes(frauncesName), false);
    }

    assert.deepEqual(
      fonts.map((font) => ({ name: font.name, style: font.style, weight: font.weight })),
      [
        { name: "Outfit", style: "normal", weight: 400 },
        { name: "Outfit", style: "normal", weight: 600 },
        { name: "Manrope", style: "normal", weight: 400 },
        { name: "Manrope", style: "normal", weight: 600 },
      ],
    );
    assert.equal(fonts[0].data.equals(readFileSync(regularPath)), true);
    assert.equal(fonts[1].data.equals(readFileSync(semiboldPath)), true);
    assert.equal(fonts[2].data.equals(readFileSync(cyrillicRegularPath)), true);
    assert.equal(fonts[3].data.equals(readFileSync(cyrillicSemiboldPath)), true);

    const license = source("assets/OFL.txt");
    assert.match(license, /Copyright 2021 The Outfit Project Authors/);
    assert.match(
      license,
      /Copyright 2018 The Manrope Project Authors \(https:\/\/github.com\/googlefonts\/manrope\)/,
    );
    assert.match(license, /SIL OPEN FONT LICENSE/);
    assert.equal(license.includes("Fraunces"), false);
  });

  it("keeps Belarusian letters in Manrope and out of Outfit", () => {
    const letters = ["ў", "і", "ё", "Ў", "І", "Ё"];

    for (const path of ["assets/Manrope-Regular.ttf", "assets/Manrope-SemiBold.ttf"]) {
      const bytes = readFileSync(new URL(path, root));
      for (const letter of letters) assert.equal(cmapHas(bytes, letter), true, path);
      assert.equal(tableTags(bytes).includes("fvar"), false);
    }

    for (const path of ["assets/Outfit-Regular.ttf", "assets/Outfit-SemiBold.ttf"]) {
      const bytes = readFileSync(new URL(path, root));
      for (const letter of letters) assert.equal(cmapHas(bytes, letter), false, path);
    }
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
