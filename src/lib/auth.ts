import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink } from "better-auth/plugins";
import { getDb } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import { appBaseUrl, appSecret } from "@/lib/config";
import { sendMagicLink } from "@/lib/mail";

function buildAuth() {
  return betterAuth({
    baseURL: appBaseUrl(),
    secret: appSecret(),
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLink({ email, url });
        },
      }),
      nextCookies(),
    ],
  });
}

let cached: ReturnType<typeof buildAuth> | undefined;

export function getAuth() {
  cached ??= buildAuth();
  return cached;
}
