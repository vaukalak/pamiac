interface Properties {
  name: string;
  you: boolean;
}

export function WorkspaceMemberName(props: Properties) {
  const { name, you } = props;

  return (
    <span className="workspace-member-name">
      {name}
      {you ? <span className="workspace-member-you">You</span> : null}
    </span>
  );
}
