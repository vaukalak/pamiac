interface Properties {
  count: number;
}

export function WorkspacePendingTitle(props: Properties) {
  const { count } = props;

  return (
    <h2>
      Pending invitations <span className="workspace-pending-count">{count}</span>
    </h2>
  );
}
