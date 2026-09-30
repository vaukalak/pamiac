import { spaceInitial } from "@/lib/library-spaces";

interface Properties {
  name: string;
}

export function WorkspaceSettingsMark(props: Properties) {
  const { name } = props;

  return (
    <span aria-hidden="true" className="workspace-space-mark workspace-settings-mark">
      {spaceInitial(name)}
    </span>
  );
}
