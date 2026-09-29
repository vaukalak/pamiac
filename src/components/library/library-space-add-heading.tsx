interface Properties {
  onClose: () => void;
}

export function LibrarySpaceAddHeading(props: Properties) {
  const { onClose } = props;

  return (
    <div className="share-dialog-head">
      <h2 id="workspace-create-title">Add workspace</h2>
      <button className="btn ghost small" onClick={onClose} type="button">
        Cancel
      </button>
    </div>
  );
}
