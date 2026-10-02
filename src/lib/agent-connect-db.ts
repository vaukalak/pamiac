import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { agentConnect } from "@/db/schema";
import {
  agentName,
  claimResult,
  connectExpiresAt,
  connectUrl,
  createConnectId,
  type ConnectClaim,
  type ConnectSnapshot,
} from "@/lib/agent-connect";
import { issueToken, revokeToken } from "@/lib/documents";
import { HttpError } from "@/lib/http";

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface StoredConnect extends ConnectSnapshot {
  id: string;
  agentName: string;
}

function readAgentName(input: string) {
  try {
    return agentName(input);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid agent name";
    throw new HttpError(400, message);
  }
}

function at(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export async function createAgentConnect(input: string, now: Date) {
  const name = readAgentName(input);
  const id = createConnectId();
  const expiresAt = connectExpiresAt(now);
  await getDb().insert(agentConnect).values({
    id,
    agentName: name,
    secret: null,
    claimedAt: null,
    expiresAt,
  });
  return { id, url: connectUrl(id) };
}

export async function findAgentConnect(id: string): Promise<StoredConnect | null> {
  const [row] = await getDb()
    .select({
      id: agentConnect.id,
      agentName: agentConnect.agentName,
      secret: agentConnect.secret,
      claimedAt: agentConnect.claimedAt,
      expiresAt: agentConnect.expiresAt,
    })
    .from(agentConnect)
    .where(eq(agentConnect.id, id));
  if (!row) return null;
  return {
    id: row.id,
    agentName: row.agentName,
    secret: row.secret,
    claimedAt: row.claimedAt ? at(row.claimedAt) : null,
    expiresAt: at(row.expiresAt),
  };
}

export async function readAgentConnect(
  id: string,
  now: Date,
): Promise<
  | { status: "pending" }
  | { status: "expired" }
  | { status: "consumed" }
  | { status: "ready"; token: string }
> {
  const row = await findAgentConnect(id);
  if (!row) throw new HttpError(404, "Connect link not found");
  const status: ConnectClaim = claimResult(row, now);
  if (status !== "ready") return { status };
  const token = await claimConnectSecret(id, now);
  if (!token) return { status: "consumed" };
  return { status: "ready", token };
}

/**
 * Postgres RETURNING sees the row after SET, so `RETURNING secret` would be null.
 * The locked secret is returned from the pre-update row in the same statement.
 */
async function claimConnectSecret(id: string, now: Date) {
  const result = await getDb().execute(sql`
    WITH locked AS (
      SELECT "id", "secret"
      FROM "agent_connect"
      WHERE "id" = ${id}
        AND "secret" IS NOT NULL
        AND "claimed_at" IS NULL
        AND "expires_at" > ${now}
      FOR UPDATE
    )
    UPDATE "agent_connect" AS connect
    SET "secret" = NULL, "claimed_at" = ${now}
    FROM locked
    WHERE connect."id" = locked."id"
    RETURNING locked."secret" AS "token"
  `);
  return claimedToken(result);
}

function claimedToken(result: unknown) {
  const rows = rowsOf(result);
  const row = rows[0];
  if (!row || typeof row !== "object" || !("token" in row)) return null;
  const token = row.token;
  return typeof token === "string" && token.length > 0 ? token : null;
}

function rowsOf(result: unknown) {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object" && "rows" in result) {
    const rows = result.rows;
    return Array.isArray(rows) ? rows : [];
  }
  return [];
}

export async function returnAgentConnect(id: string, userId: string, now: Date) {
  const row = await findAgentConnect(id);
  if (!row || row.expiresAt.getTime() <= now.getTime()) {
    throw new HttpError(404, "This link has expired");
  }
  if (row.secret || row.claimedAt) throw new HttpError(409, "This link was already used");

  const issued = await issueToken(userId, row.agentName, new Date(now.getTime() + TOKEN_TTL_MS), {
    all: true,
  });
  const [updated] = await getDb()
    .update(agentConnect)
    .set({ secret: issued.token, userId, tokenId: issued.id })
    .where(
      and(
        eq(agentConnect.id, id),
        isNull(agentConnect.secret),
        isNull(agentConnect.claimedAt),
        gt(agentConnect.expiresAt, now),
      ),
    )
    .returning({ id: agentConnect.id });
  if (!updated) {
    await revokeToken(userId, issued.id);
    const again = await findAgentConnect(id);
    if (!again || again.expiresAt.getTime() <= now.getTime()) {
      throw new HttpError(404, "This link has expired");
    }
    throw new HttpError(409, "This link was already used");
  }
  return { status: "ready" as const, agentName: row.agentName };
}
