"use client";

import { useQuery } from "@tanstack/react-query";
import { LibraryManageDanger } from "@/components/library/library-manage-danger";
import { WorkspaceMemberAdd } from "@/components/library/workspace-member-add";
import { openWorkspaceName, PERSONAL_SPACE_ID } from "@/lib/library-spaces";
import { workspacesQueryOptions } from "@/lib/library-workspaces";
import { Paragraph } from "@/ui/Paragraph";
import { Section } from "@/ui/Section";

interface Properties {
  managing: boolean;
  workspaceId: string;
}

export function LibraryManage(props: Properties) {
  const { managing, workspaceId } = props;
  const spaces = useQuery(workspacesQueryOptions());
  const name = openWorkspaceName(workspaceId, spaces.data);

  return (
    <Section className="library-manage">
      {name ? <h2 className="library-manage-name">{name}</h2> : null}
      {workspaceId === PERSONAL_SPACE_ID ? (
        <Paragraph className="hint">Personal space has no shared members.</Paragraph>
      ) : null}
      {managing ? <WorkspaceMemberAdd key={workspaceId} workspaceId={workspaceId} /> : null}
      <LibraryManageDanger managing={managing} workspaceId={workspaceId} />
    </Section>
  );
}
