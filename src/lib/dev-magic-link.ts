export function devMagicLinkVisible() {
  const production =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (production) return false;
  if (process.env.RESEND_API_KEY) return false;
  return process.env.PAMIAC_DEV_MAGIC_LINK === "1" || process.env.CURSOR_AGENT === "1";
}
