import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { oauthConsent } from "@/db/schema";
import type { ConnectConsentRow } from "@/lib/connect-consents-query";
import { platformFromClientId } from "@/lib/connect-platforms";

export type { ConnectConsentRow };

function connectedAtValue(value: Date | null) {
  if (!(value instanceof Date)) return null;
  if (Number.isNaN(value.getTime())) return null;
  return value.toISOString();
}

export async function listConnectConsents(userId: string): Promise<ConnectConsentRow[]> {
  const rows = await getDb()
    .select({
      clientId: oauthConsent.clientId,
      createdAt: oauthConsent.createdAt,
    })
    .from(oauthConsent)
    .where(eq(oauthConsent.userId, userId));

  const seen = new Map<ConnectConsentRow["platform"], ConnectConsentRow>();
  for (const row of rows) {
    const platform = platformFromClientId(row.clientId);
    if (!platform) continue;
    const connectedAt = connectedAtValue(row.createdAt);
    const current = seen.get(platform);
    if (current?.connectedAt && (!connectedAt || current.connectedAt >= connectedAt)) continue;
    seen.set(platform, { platform, connectedAt });
  }
  return [...seen.values()];
}
