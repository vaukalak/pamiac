export const VISIBILITIES = ["private", "workspace", "public", "password", "emails"] as const;
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

export type ShareGrant = {
  id: string;
  kind: "document" | "folder";
  visibility: Visibility;
  allowedEmails: string[];
  passwordOk: boolean;
};

export type InheritedAccess =
  | { level: "edit"; reason: "owner" | "member" }
  | { level: "view"; reason: "public" | "password" | "email" }
  | {
      level: "locked";
      reason: "password" | "login" | "email";
      unlockId: string;
      unlockKind: "document" | "folder";
    }
  | { level: "none" };

export function resolveInheritedAccess(input: {
  isOwner: boolean;
  workspaceMember?: boolean;
  viewerEmail: string | null;
  grants: ShareGrant[];
}): InheritedAccess {
  if (input.isOwner) return { level: "edit", reason: "owner" };
  if (input.workspaceMember) return { level: "edit", reason: "member" };
  const resolved = input.grants.map((grant) => ({
    grant,
    access: resolveAccess({
      isOwner: false,
      workspaceMember: false,
      visibility: grant.visibility,
      viewerEmail: input.viewerEmail,
      allowedEmails: grant.allowedEmails,
      passwordOk: grant.passwordOk,
    }),
  }));
  const view = resolved.find((item) => item.access.level === "view");
  if (view && view.access.level === "view") {
    return { level: "view", reason: view.access.reason };
  }
  const locked = resolved.flatMap((item) =>
    item.access.level === "locked" ? [{ grant: item.grant, access: item.access }] : [],
  );
  const password = locked.find((item) => item.access.reason === "password");
  const login = locked.find((item) => item.access.reason === "login");
  const email = locked.find((item) => item.access.reason === "email");
  const chosen = password ?? login ?? email;
  if (chosen && chosen.access.level === "locked") {
    return {
      level: "locked",
      reason: chosen.access.reason,
      unlockId: chosen.grant.id,
      unlockKind: chosen.grant.kind,
    };
  }
  return { level: "none" };
}

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
