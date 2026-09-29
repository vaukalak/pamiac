export function workspaceInvitePath(inviteId: string) {
  return `/workspace?invite=${encodeURIComponent(inviteId)}`;
}

export function sameInviteEmail(invited: string, signedIn: string) {
  const left = invited.trim().toLowerCase();
  const right = signedIn.trim().toLowerCase();
  return left.length > 0 && left === right;
}
