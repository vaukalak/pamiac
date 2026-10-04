import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "./http.ts";
import { decodeImageBase64 } from "./image-base64.ts";

test("decodeImageBase64 accepts base64 and ignores whitespace", () => {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const encoded = Buffer.from(bytes).toString("base64");
  const spaced = `${encoded.slice(0, 4)}\n ${encoded.slice(4)}`;

  assert.deepEqual(decodeImageBase64(encoded), bytes);
  assert.deepEqual(decodeImageBase64(spaced), bytes);
});

test("decodeImageBase64 rejects empty and whitespace-only input", () => {
  for (const data of ["", "   \n\t"]) {
    assert.throws(
      () => decodeImageBase64(data),
      (error: unknown) =>
        error instanceof HttpError && error.message === "Image data is not valid base64.",
    );
  }
});

test("decodeImageBase64 rejects invalid base64 and a data URL prefix", () => {
  for (const data of [
    "!!!!",
    "abc",
    "data:image/png;base64,aGVsbG8=",
    "  data:image/gif;base64,aGk=",
  ]) {
    assert.throws(
      () => decodeImageBase64(data),
      (error: unknown) => {
        assert.ok(error instanceof HttpError);
        assert.equal(error.status, 400);
        assert.equal(error.message, "Image data is not valid base64.");
        return true;
      },
    );
  }
});
