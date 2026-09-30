const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

export function editedLabel(updatedAt: string, now = Date.now()) {
  const then = new Date(updatedAt).getTime();
  if (Number.isNaN(then)) return "recently";
  const seconds = Math.max(0, Math.round((now - then) / 1000));
  if (seconds < MINUTE) return "just now";
  if (seconds < HOUR) return `${Math.round(seconds / MINUTE)}m ago`;
  if (seconds < DAY) return `${Math.round(seconds / HOUR)}h ago`;
  if (seconds < MONTH) return `${Math.round(seconds / DAY)}d ago`;
  if (seconds < YEAR) return `${Math.round(seconds / MONTH)}mo ago`;
  return `${Math.round(seconds / YEAR)}y ago`;
}
