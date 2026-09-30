import { WorkspaceMemberColumnRow } from "@/components/workspace-members/workspace-member-column-row";

interface Properties {
  when: string;
}

export function WorkspaceMemberColumns(props: Properties) {
  const { when } = props;

  return (
    <thead>
      <WorkspaceMemberColumnRow when={when} />
    </thead>
  );
}
