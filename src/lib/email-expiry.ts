/** Magic-link lifetime. Better Auth's plugin default is 5 minutes; Pamiac uses 15. */
export const MAGIC_LINK_EXPIRES_MINUTES = 15;
export const MAGIC_LINK_EXPIRES_SECONDS = MAGIC_LINK_EXPIRES_MINUTES * 60;

/** Password-reset lifetime. Matches Better Auth's default of one hour. */
export const PASSWORD_RESET_EXPIRES_SECONDS = 60 * 60;

export function passwordResetExpiryPhrase() {
  if (PASSWORD_RESET_EXPIRES_SECONDS === 60 * 60) return "1 hour";
  const minutes = Math.round(PASSWORD_RESET_EXPIRES_SECONDS / 60);
  return `${minutes} minutes`;
}
