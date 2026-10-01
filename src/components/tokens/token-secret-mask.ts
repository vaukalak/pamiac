const PREFIX = "pam_";
const BULLETS = "\u2022\u2022\u2022";

export function maskTokenSecret(secret: string) {
  const fits = secret.startsWith(PREFIX) && secret.length > PREFIX.length + 2;
  if (!fits) return BULLETS;
  return `${PREFIX}${BULLETS}${secret.slice(-2)}`;
}
