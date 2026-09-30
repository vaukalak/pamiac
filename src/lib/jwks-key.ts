import { symmetricDecrypt, symmetricEncrypt } from "better-auth/crypto";

interface LiveJwksRow {
  createdAt: Date;
  expiresAt: Date | null;
}

interface OkpPublicJwk {
  kty: "OKP";
  crv: "Ed25519";
  x: string;
}

interface OkpPrivateJwk extends OkpPublicJwk {
  d: string;
}

export interface EncryptedJwksRecord {
  id: string;
  publicKey: string;
  privateKey: string;
  createdAt: Date;
  alg: "EdDSA";
  crv: "Ed25519";
}

export async function privateKeyDecrypts(storedPrivateKey: string, secret: string) {
  try {
    const parsed: unknown = JSON.parse(storedPrivateKey);
    if (typeof parsed !== "string") return false;
    await symmetricDecrypt({ key: secret, data: parsed });
    return true;
  } catch {
    return false;
  }
}

/** Newest row that Better Auth still treats as live: no expiry, or expiry strictly after `now`. */
export function latestLiveJwks<Row extends LiveJwksRow>(rows: readonly Row[], now: Date) {
  return rows
    .filter((row) => row.expiresAt === null || row.expiresAt > now)
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];
}

export async function buildEncryptedJwksRecord(secret: string): Promise<EncryptedJwksRecord> {
  const generated = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  if (!("publicKey" in generated)) {
    throw new Error("Ed25519 key generation did not return a key pair");
  }
  const publicJwk = okpPublic(await crypto.subtle.exportKey("jwk", generated.publicKey));
  const privateJwk = okpPrivate(await crypto.subtle.exportKey("jwk", generated.privateKey));
  const encrypted = await symmetricEncrypt({
    key: secret,
    data: JSON.stringify(privateJwk),
  });
  return {
    id: crypto.randomUUID(),
    alg: "EdDSA",
    crv: "Ed25519",
    publicKey: JSON.stringify(publicJwk),
    privateKey: JSON.stringify(encrypted),
    createdAt: new Date(),
  };
}

function okpPublic(jwk: JsonWebKey): OkpPublicJwk {
  if (jwk.kty !== "OKP" || jwk.crv !== "Ed25519" || !jwk.x) {
    throw new Error("Ed25519 public key is missing kty, crv, or x");
  }
  return { kty: "OKP", crv: "Ed25519", x: jwk.x };
}

function okpPrivate(jwk: JsonWebKey): OkpPrivateJwk {
  const publicJwk = okpPublic(jwk);
  if (!jwk.d) throw new Error("Ed25519 private key is missing d");
  return { ...publicJwk, d: jwk.d };
}
