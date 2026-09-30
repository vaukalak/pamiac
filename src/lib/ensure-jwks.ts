import { getDb } from "@/db";
import { jwks } from "@/db/schema";
import { appSecret } from "@/lib/config";
import { buildEncryptedJwksRecord, latestLiveJwks, privateKeyDecrypts } from "@/lib/jwks-key";

const ensuredSecrets = new Set<string>();

export async function ensureLiveJwks() {
  const secret = appSecret();
  if (ensuredSecrets.has(secret)) return;

  const rows = await getDb().select().from(jwks);
  const latest = latestLiveJwks(rows, new Date());
  if (latest && (await privateKeyDecrypts(latest.privateKey, secret))) {
    ensuredSecrets.add(secret);
    return;
  }

  await getDb()
    .insert(jwks)
    .values(await buildEncryptedJwksRecord(secret));
  ensuredSecrets.add(secret);
}
