const DEFAULT_HOST = "https://us.i.posthog.com";

type Env = Record<string, string | undefined>;

export interface PostHogPerson {
  id?: string | null;
  email?: string | null;
}

export interface PostHogIdentifyCall {
  distinctId: string;
  properties: {
    email?: string;
  };
}

export function posthogProjectTokenFrom(value: string | undefined) {
  const token = value?.trim() ?? "";
  return token.length > 0 ? token : null;
}

export function posthogHostFrom(value: string | undefined) {
  const host = value?.trim() ?? "";
  return host.length > 0 ? host : DEFAULT_HOST;
}

export function posthogProjectToken(env: Env = process.env) {
  return posthogProjectTokenFrom(env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);
}

export function posthogHost(env: Env = process.env) {
  return posthogHostFrom(env.NEXT_PUBLIC_POSTHOG_HOST);
}

/** Distinct id is the account id. Email is only a person property. */
export function posthogIdentifyCall(
  person: PostHogPerson | null | undefined,
): PostHogIdentifyCall | null {
  const distinctId = person?.id?.trim() ?? "";
  if (!distinctId) return null;
  const email = person?.email?.trim() ?? "";
  if (!email) return { distinctId, properties: {} };
  return { distinctId, properties: { email } };
}

export function posthogLogoutEffect(): "reset" {
  return "reset";
}

export function posthogSdkCallable(input: { token: string | null; loaded: boolean }) {
  return input.token !== null && input.loaded;
}
