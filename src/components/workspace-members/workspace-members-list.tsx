"use client";

import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useLibraryShell } from "@/components/library/library-shell";
import {
  WorkspaceMemberFilters,
  type FilterValues,
} from "@/components/workspace-members/workspace-member-filters";
import { WorkspaceMemberTable } from "@/components/workspace-members/workspace-member-table";
import { WorkspacePendingSection } from "@/components/workspace-members/workspace-pending-section";
import { managesWorkspace, PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { workspaceRosterQueryOptions, workspacesQueryOptions } from "@/lib/library-workspaces";
import { matchingMembers, matchingPending } from "@/lib/workspace-member-view";
import { Alert } from "@/ui/Alert";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  email: string;
}

export function WorkspaceMembersList(props: Properties) {
  const { email } = props;
  const shell = useLibraryShell();
  const { workspaceId, workspaces } = shell;
  const spaces = useQuery({
    ...workspacesQueryOptions(),
    initialData: workspaces,
  });
  const roster = useQuery({
    ...workspaceRosterQueryOptions(workspaceId),
    enabled: workspaceId !== PERSONAL_SPACE_ID,
  });
  const form = useForm<FilterValues>({
    defaultValues: { query: "", memberRole: "all" },
  });
  const query = form.watch("query") ?? "";
  const role = form.watch("memberRole") ?? "all";

  if (workspaceId === PERSONAL_SPACE_ID) return null;

  const managing = managesWorkspace(workspaceId, spaces.data ?? []);
  const message = roster.error instanceof Error ? roster.error.message : "";

  if (roster.isPending) return <Paragraph>Loading members…</Paragraph>;
  if (roster.isError) return <Alert>{message || "Could not load members"}</Alert>;

  const members = matchingMembers(roster.data.members, query, role);
  const pending = matchingPending(roster.data.invites, query, role);

  return (
    <div className="workspace-members">
      <WorkspaceMemberFilters form={form} />
      <WorkspaceMemberTable
        email={email}
        managing={managing}
        members={members}
        workspaceId={workspaceId}
      />
      <WorkspacePendingSection managing={managing} pending={pending} workspaceId={workspaceId} />
      <Paragraph>Only admins can manage members and invitations.</Paragraph>
    </div>
  );
}
