export const VISIBILITIES = ["private", "public", "password", "emails"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export type Access =
  | { level: "edit"; reason: "owner" | "member" }
  | { level: "view"; reason: "public" | "password" | "email" }
  | { level: "locked"; reason: "password" | "login" | "email" }
  | { level: "none" };

export function resolveAccess(input: {
  isOwner: boolean;
  visibility: Visibility;
  viewerEmail: string | null;
  allowedEmails: string[];
  passwordOk: boolean;
  workspaceMember?: boolean;
}): Access {
  if (input.isOwner) return { level: "edit", reason: "owner" };
  if (input.workspaceMember) return { level: "edit", reason: "member" };
  if (input.visibility === "public") return { level: "view", reason: "public" };
  if (input.visibility === "password") {
    return input.passwordOk
      ? { level: "view", reason: "password" }
      : { level: "locked", reason: "password" };
  }
  if (input.visibility === "emails") {
    if (!input.viewerEmail) return { level: "locked", reason: "login" };
    const email = input.viewerEmail.toLowerCase();
    const allowed = input.allowedEmails.some((item) => item.toLowerCase() === email);
    return allowed ? { level: "view", reason: "email" } : { level: "locked", reason: "email" };
  }
  return { level: "none" };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmails(emails: string[]): string[] {
  const unique = new Set<string>();
  for (const email of emails) {
    const value = email.trim().toLowerCase();
    if (!value) continue;
    if (!EMAIL.test(value)) {
      throw new Error(`Invalid email: ${email.trim()}`);
    }
    unique.add(value);
  }
  return [...unique];
}
