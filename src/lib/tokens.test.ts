import assert from "node:assert/strict";
import test from "node:test";
import { resolveTokenExpiration } from "./tokens.ts";

const now = new Date("2026-06-01T00:00:00.000Z");

test("7 day preset expires seven days out", () => {
  assert.equal(
    resolveTokenExpiration({ preset: "7d" }, now)?.toISOString(),
    "2026-06-08T00:00:00.000Z",
  );
});

test("30 day preset expires thirty days out", () => {
  assert.equal(
    resolveTokenExpiration({ preset: "30d" }, now)?.toISOString(),
    "2026-07-01T00:00:00.000Z",
  );
});

test("90 day preset expires ninety days out", () => {
  assert.equal(
    resolveTokenExpiration({ preset: "90d" }, now)?.toISOString(),
    "2026-08-30T00:00:00.000Z",
  );
});

test("1 year preset expires 365 days out", () => {
  assert.equal(
    resolveTokenExpiration({ preset: "1y" }, now)?.toISOString(),
    "2027-06-01T00:00:00.000Z",
  );
});

test("never stores no expiration", () => {
  assert.equal(resolveTokenExpiration({ preset: "never" }, now), null);
});

test("future custom date expires at the end of that UTC day", () => {
  assert.equal(
    resolveTokenExpiration({ date: "2026-12-31" }, now)?.toISOString(),
    "2026-12-31T23:59:59.999Z",
  );
});

test("past custom date is rejected", () => {
  assert.throws(
    () => resolveTokenExpiration({ date: "2020-01-01" }, now),
    /Expiration must be in the future/,
  );
});

test("garbage expiration input is rejected", () => {
  assert.throws(() => resolveTokenExpiration("tomorrow", now), /Invalid expiration/);
  assert.throws(() => resolveTokenExpiration(null, now), /Invalid expiration/);
  assert.throws(() => resolveTokenExpiration({ date: "not-a-date" }, now), /Invalid expiration/);
  assert.throws(() => resolveTokenExpiration({ preset: "2d" }, now), /Invalid expiration/);
  assert.throws(() => resolveTokenExpiration({}, now), /Invalid expiration/);
});

test("a custom date later the same day stays in the future", () => {
  assert.equal(
    resolveTokenExpiration({ date: "2026-06-01" }, now)?.toISOString(),
    "2026-06-01T23:59:59.999Z",
  );
});

test("a custom date that is not strictly after now is rejected", () => {
  const end = new Date("2026-06-01T23:59:59.999Z");
  assert.throws(
    () => resolveTokenExpiration({ date: "2026-06-01" }, end),
    /Expiration must be in the future/,
  );
});

test("an impossible calendar date is rejected", () => {
  assert.throws(() => resolveTokenExpiration({ date: "2026-02-31" }, now), /Invalid expiration/);
  assert.throws(() => resolveTokenExpiration({ date: "2026-02-29" }, now), /Invalid expiration/);
});

test("ambiguous and non-object expiration values are rejected", () => {
  assert.throws(
    () => resolveTokenExpiration({ preset: "7d", date: "2026-12-31" }, now),
    /Invalid expiration/,
  );
  assert.throws(() => resolveTokenExpiration(["7d"], now), /Invalid expiration/);
  assert.throws(() => resolveTokenExpiration({ date: " 2026-12-31" }, now), /Invalid expiration/);
  assert.throws(() => resolveTokenExpiration({ preset: 7 }, now), /Invalid expiration/);
});
