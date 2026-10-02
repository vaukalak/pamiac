import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { dash } from "@better-auth/infra";
import { mcp } from "@better-auth/mcp";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { jwt, magicLink } from "better-auth/plugins";
import { getDb } from "@/db";
import {
  account,
  jwks,
  oauthAccessToken,
  oauthClient,
  oauthClientAssertion,
  oauthClientResource,
  oauthConsent,
  oauthRefreshToken,
  oauthResource,
  session,
  user,
  verification,
} from "@/db/schema";
import { appBaseUrl, appSecret } from "@/lib/config";
import { googleSocialProviders } from "@/lib/google-sign-in";
import { mcpResourceUrl } from "@/lib/mcp-resource";
import { sendMagicLink } from "@/lib/mail";

function buildAuth() {
  return betterAuth({
    baseURL: appBaseUrl(),
    secret: appSecret(),
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
      },
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
    },
    socialProviders: googleSocialProviders(),
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: {
        user,
        session,
        account,
        verification,
        jwks,
        oauthClient,
        oauthResource,
        oauthClientResource,
        oauthRefreshToken,
        oauthAccessToken,
        oauthConsent,
        oauthClientAssertion,
      },
    }),
    plugins: [
      jwt(),
      mcp({
        loginPage: "/login",
        consentPage: "/oauth/consent",
        resource: mcpResourceUrl(),
      }),
      cimd({
        fetchClientMetadataResource,
        metadataProfile: "mcp-2026-07-28",
      }),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLink({ email, url });
        },
      }),
      dash({
        apiKey: process.env.BETTER_AUTH_API_KEY,
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
