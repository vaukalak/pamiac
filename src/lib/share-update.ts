import { normalizeEmails, type Visibility } from "./access.ts";
import { HttpError } from "./http.ts";
import { hashPassword } from "./passwords.ts";

export function prepareShareCredentials(input: {
  visibility: Visibility;
  password?: string;
  emails?: string[];
  currentPasswordHash: string | null;
}) {
  const emails = input.visibility === "emails" ? normalizeEmails(input.emails ?? []) : [];
  if (input.visibility === "emails" && emails.length === 0) {
    throw new HttpError(400, "Add at least one email address");
  }
  let passwordHash = input.currentPasswordHash;
  if (input.visibility === "password") {
    if (input.password) {
      if (input.password.length < 4) {
        throw new HttpError(400, "Password must be at least 4 characters");
      }
      passwordHash = hashPassword(input.password);
    } else if (!passwordHash) {
      throw new HttpError(400, "Set a password for this link");
    }
  }
  return { emails, passwordHash };
}
