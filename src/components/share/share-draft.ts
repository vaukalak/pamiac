import type { Visibility } from "@/lib/access";

export interface ShareDraft {
  emails: string;
  password: string;
  visibility: Visibility;
}

export function shareEmailList(value: string) {
  return value
    .split(/[\n,]/)
    .map((email) => email.trim())
    .filter(Boolean);
}

export function shareDraftError(values: ShareDraft, hasPassword: boolean) {
  if (values.visibility === "emails" && shareEmailList(values.emails).length === 0) {
    return { field: "emails" as const, message: "Add at least one email address" };
  }
  if (values.visibility !== "password") return null;
  if (values.password && values.password.length < 4) {
    return { field: "password" as const, message: "Password must be at least 4 characters" };
  }
  if (!values.password && !hasPassword) {
    return { field: "password" as const, message: "Set a password for this link" };
  }
  return null;
}
