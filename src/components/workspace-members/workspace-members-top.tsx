"use client";

import { WorkspaceMembersHeading } from "@/components/workspace-members/workspace-members-heading";
import { WorkspaceMembersInvite } from "@/components/workspace-members/workspace-members-invite";

export function WorkspaceMembersTop() {
  return (
    <div className="library-heading">
      <WorkspaceMembersHeading />
      <WorkspaceMembersInvite />
    </div>
  );
}
