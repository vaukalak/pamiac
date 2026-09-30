import assert from "node:assert/strict";
import test from "node:test";
import { symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";
import { buildEncryptedJwksRecord, latestLiveJwks, privateKeyDecrypts } from "./jwks-key.ts";

const secret = "current-better-auth-secret";

async function storedPrivateKey(key: string) {
  return JSON.stringify(
    await symmetricEncrypt({
      key,
      data: JSON.stringify({ kty: "OKP", crv: "Ed25519", x: "x", d: "d" }),
    }),
  );
}

test("same secret decrypts a stored private key", async () => {
  const stored = await storedPrivateKey(secret);
  assert.equal(await privateKeyDecrypts(stored, secret), true);
});

test("a different secret does not decrypt a stored private key", async () => {
  const stored = await storedPrivateKey(secret);
  assert.equal(await privateKeyDecrypts(stored, "other-secret"), false);
});

test("non-string JSON does not decrypt", async () => {
  assert.equal(await privateKeyDecrypts(JSON.stringify({ kty: "OKP" }), secret), false);
  assert.equal(await privateKeyDecrypts("null", secret), false);
  assert.equal(await privateKeyDecrypts("42", secret), false);
});

test("invalid JSON does not throw and does not decrypt", async () => {
  assert.equal(await privateKeyDecrypts("{", secret), false);
  assert.equal(await privateKeyDecrypts("", secret), false);
});

test("latest live row is the newest unexpired row", () => {
  const now = new Date("2026-06-01T00:00:00.000Z");
  const rows = [
    {
      id: "older-live",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      expiresAt: null,
    },
    {
      id: "expires-now",
      createdAt: new Date("2026-05-20T00:00:00.000Z"),
      expiresAt: now,
    },
    {
      id: "newest-expired",
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
      expiresAt: new Date("2026-05-15T00:00:00.000Z"),
    },
    {
      id: "middle-live",
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
      expiresAt: new Date("2026-12-01T00:00:00.000Z"),
    },
  ];

  const ids = rows.map((row) => row.id);
  assert.equal(latestLiveJwks(rows, now)?.id, "middle-live");
  assert.deepEqual(
    rows.map((row) => row.id),
    ids,
  );
  assert.equal(latestLiveJwks([], now), undefined);
});

test("a freshly built record decrypts back to a private JWK", async () => {
  const record = await buildEncryptedJwksRecord(secret);
  const parsed: unknown = JSON.parse(record.privateKey);
  assert.equal(typeof parsed, "string");
  const decrypted = await symmetricDecrypt({ key: secret, data: parsed as string });
  const jwk = JSON.parse(decrypted) as { kty?: string; d?: string };

  assert.equal(jwk.kty, "OKP");
  assert.equal(typeof jwk.d, "string");
  assert.ok(jwk.d);
  assert.equal(record.alg, "EdDSA");
  assert.equal(record.crv, "Ed25519");

  const publicJwk = JSON.parse(record.publicKey) as { kty?: string; crv?: string; x?: string };
  assert.equal(publicJwk.kty, "OKP");
  assert.equal(publicJwk.crv, "Ed25519");
  assert.equal(typeof publicJwk.x, "string");
  assert.equal("d" in publicJwk, false);
});
