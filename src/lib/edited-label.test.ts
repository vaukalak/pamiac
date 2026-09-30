import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { editedLabel } from "./edited-label.ts";

const NOW = Date.parse("2026-09-30T18:00:00.000Z");

describe("edited label", () => {
  it("names a recent edit and an invalid timestamp honestly", () => {
    assert.equal(editedLabel(new Date(NOW - 20_000).toISOString(), NOW), "just now");
    assert.equal(editedLabel("not-a-date", NOW), "recently");
    assert.equal(editedLabel(new Date(NOW + 60_000).toISOString(), NOW), "just now");
  });

  it("uses hours and days from the document timestamp", () => {
    assert.equal(editedLabel(new Date(NOW - 2 * 60 * 60 * 1000).toISOString(), NOW), "2h ago");
    assert.equal(editedLabel(new Date(NOW - 3 * 24 * 60 * 60 * 1000).toISOString(), NOW), "3d ago");
    assert.equal(editedLabel(new Date(NOW - 45 * 60 * 1000).toISOString(), NOW), "45m ago");
  });
});
