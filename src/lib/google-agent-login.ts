import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { agentGoogleLogin } from "@/db/schema";
import { issueToken, revokeToken } from "@/lib/documents";
import {
  GOOGLE_LOGIN_EXPIRES_SECONDS,
  GOOGLE_LOGIN_INTERVAL_SECONDS,
  createDeviceCode,
  createUserCode,
  googleAgentName,
  googleLoginHttpStatus,
  googleLoginPoll,
  googleTokenName,
  googleVerificationUrl,
  hashGoogleCode,
  normalizeUserCode,
} from "@/lib/google-agent-login-code";
import { HttpError } from "@/lib/http";

export async function createGoogleAgentLogin(input: { agent: unknown; origin: string }) {
  const agentName = googleAgentName(input.agent);
  const deviceCode = createDeviceCode();
  const userCode = createUserCode();
  const expiresAt = new Date(Date.now() + GOOGLE_LOGIN_EXPIRES_SECONDS * 1000);
  await getDb()
    .insert(agentGoogleLogin)
    .values({
      id: crypto.randomUUID(),
      deviceCodeHash: hashGoogleCode(deviceCode),
      userCodeHash: hashGoogleCode(userCode),
      agentName,
      expiresAt,
    });
  return {
    deviceCode,
    userCode,
    verificationUrl: googleVerificationUrl(input.origin, userCode),
    intervalSeconds: GOOGLE_LOGIN_INTERVAL_SECONDS,
    expiresIn: GOOGLE_LOGIN_EXPIRES_SECONDS,
  };
}

export async function pollGoogleAgentLogin(deviceCode: string) {
  const code = deviceCode.trim();
  if (!code) {
    return { status: 404, body: { status: "invalid" as const } };
  }
  const [row] = await getDb()
    .select({
      id: agentGoogleLogin.id,
      deniedAt: agentGoogleLogin.deniedAt,
      expiresAt: agentGoogleLogin.expiresAt,
      userId: agentGoogleLogin.userId,
      tokenSecret: agentGoogleLogin.tokenSecret,
    })
    .from(agentGoogleLogin)
    .where(eq(agentGoogleLogin.deviceCodeHash, hashGoogleCode(code)));
  const kind = googleLoginPoll(row ?? null, Date.now());
  if (kind.status === "ready" && row?.tokenSecret) {
    const secret = row.tokenSecret;
    const [taken] = await getDb()
      .update(agentGoogleLogin)
      .set({ tokenSecret: null })
      .where(and(eq(agentGoogleLogin.id, row.id), eq(agentGoogleLogin.tokenSecret, secret)))
      .returning({ id: agentGoogleLogin.id });
    if (!taken) {
      return { status: 410, body: { status: "expired" as const } };
    }
    return { status: 200, body: { status: "ready" as const, token: secret } };
  }
  return {
    status: googleLoginHttpStatus(kind.status),
    body: { status: kind.status },
  };
}

async function openGoogleLogin(userCode: string) {
  const normalized = normalizeUserCode(userCode);
  if (!normalized) throw new HttpError(400, "Unknown user code");
  const [row] = await getDb()
    .select({
      id: agentGoogleLogin.id,
      agentName: agentGoogleLogin.agentName,
      expiresAt: agentGoogleLogin.expiresAt,
      deniedAt: agentGoogleLogin.deniedAt,
      userId: agentGoogleLogin.userId,
    })
    .from(agentGoogleLogin)
    .where(eq(agentGoogleLogin.userCodeHash, hashGoogleCode(normalized)));
  if (!row) throw new HttpError(400, "Unknown user code");
  if (row.expiresAt.getTime() <= Date.now() || row.deniedAt || row.userId) {
    throw new HttpError(400, "That code has expired");
  }
  return row;
}

function pendingLogin(id: string) {
  return and(
    eq(agentGoogleLogin.id, id),
    isNull(agentGoogleLogin.userId),
    isNull(agentGoogleLogin.deniedAt),
    gt(agentGoogleLogin.expiresAt, new Date()),
  );
}

export async function decideGoogleAgentLogin(
  userId: string,
  userCode: string,
  decision: "approve" | "deny",
) {
  const row = await openGoogleLogin(userCode);
  if (decision === "deny") {
    const [updated] = await getDb()
      .update(agentGoogleLogin)
      .set({ deniedAt: new Date() })
      .where(pendingLogin(row.id))
      .returning({ id: agentGoogleLogin.id });
    if (!updated) throw new HttpError(400, "That code has expired");
    return;
  }
  const issued = await issueToken(userId, googleTokenName(row.agentName), null, { all: true });
  const [updated] = await getDb()
    .update(agentGoogleLogin)
    .set({ userId, tokenSecret: issued.token })
    .where(pendingLogin(row.id))
    .returning({ id: agentGoogleLogin.id });
  if (!updated) {
    await revokeToken(userId, issued.id);
    throw new HttpError(400, "That code has expired");
  }
}
