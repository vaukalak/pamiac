export function memberInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  const firstWord = words[0];
  if (!firstWord) return "";
  const [first] = Array.from(firstWord);
  const secondWord = words[1];
  if (!secondWord) return (first ?? "").toLocaleUpperCase("en");
  const [second] = Array.from(secondWord);
  return `${first ?? ""}${second ?? ""}`.toLocaleUpperCase("en");
}

export function memberRoleLabel(role: string) {
  if (role === "admin") return "Admin";
  return "Editor";
}

export function memberJoinedLabel(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function pendingSentLabel(iso: string, now = new Date()) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return "Sent today";
  return memberJoinedLabel(iso);
}

export function sameMemberEmail(memberEmail: string, currentEmail: string) {
  return memberEmail.trim().toLowerCase() === currentEmail.trim().toLowerCase();
}

export function matchingMembers<Member extends { name: string; email: string; role: string }>(
  members: readonly Member[],
  query: string,
  role: string,
) {
  const needle = query.trim().toLowerCase();
  return members.filter((member) => {
    if (role !== "all" && member.role !== role) return false;
    if (!needle) return true;
    return `${member.name} ${member.email}`.toLowerCase().includes(needle);
  });
}

export function matchingPending<Pending extends { email: string }>(
  pending: readonly Pending[],
  query: string,
  role: string,
) {
  if (role !== "all") return [];
  const needle = query.trim().toLowerCase();
  if (!needle) return [...pending];
  return pending.filter((row) => row.email.toLowerCase().includes(needle));
}
