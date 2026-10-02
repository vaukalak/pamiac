const FALLBACK = "We could not send the link.";

export function loginSendFailureSentence(serverMessage: unknown, fallback = FALLBACK) {
  if (typeof serverMessage !== "string") return fallback;
  const text = serverMessage.trim();
  if (!isShortHumanSentence(text)) return fallback;
  if (/[.!?]$/.test(text)) return text;
  return `${text}.`;
}

function isShortHumanSentence(text: string) {
  if (text.length < 2 || text.length > 100) return false;
  if (/[\r\n]/.test(text)) return false;
  if (/magic\s*link/i.test(text)) return false;
  if (/\b[1-5]\d{2}\b/.test(text)) return false;
  if (/[{}[\]<>`\\/()]/.test(text)) return false;
  if (/\bat\s+\S+:\d+/.test(text)) return false;
  if (/\bstack\b/i.test(text)) return false;
  if (!/^[A-Za-z][A-Za-z0-9 ,'"-]*[.!?]?$/.test(text)) return false;
  const endings = text.match(/[.!?]/g);
  if (endings && (endings.length > 1 || !/[.!?]$/.test(text))) return false;
  const words = text.replace(/[.!?]$/, "").split(/\s+/);
  return words.length >= 2 && words.length <= 14;
}
