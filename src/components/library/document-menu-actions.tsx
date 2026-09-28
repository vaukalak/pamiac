interface Properties {
  onDelete: () => void;
  onRename: () => void;
  onShare: () => void;
}

export function DocumentMenuActions(props: Properties) {
  const { onDelete, onRename, onShare } = props;

  return (
    <div className="menu-actions">
      <button className="menu-item" onClick={onRename} role="menuitem" type="button">
        Rename
      </button>
      <button className="menu-item" onClick={onShare} role="menuitem" type="button">
        Share
      </button>
      <button className="menu-item" onClick={onDelete} role="menuitem" type="button">
        Delete
      </button>
    </div>
  );
}
