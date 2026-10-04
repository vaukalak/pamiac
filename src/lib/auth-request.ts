import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";
import { ensureLiveJwks } from "@/lib/ensure-jwks";
import { prepareOauthRegisterRequest } from "@/lib/oauth-native-registration";

function oauthServerError() {
  return Response.json(
    {
      error: "server_error",
      error_description: "The authorization server failed to handle the request",
    },
    { status: 500 },
  );
}

export async function handleAuthRequest(request: Request) {
  if (!process.env.DATABASE_URL) {
    return Response.json({ error: "DATABASE_URL is not set" }, { status: 500 });
  }
  try {
    await ensureLiveJwks();
    const handlers = toNextJsHandler(getAuth());
    const prepared = await prepareOauthRegisterRequest(request);
    const response =
      prepared.method === "POST" ? await handlers.POST(prepared) : await handlers.GET(prepared);
    if (response.status < 500) return response;
    const body = await response.clone().text();
    if (body.length > 0) return response;
    return oauthServerError();
  } catch (error) {
    console.error(error);
    return oauthServerError();
  }
}
