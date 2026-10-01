interface Properties {
  onClose: () => void;
}

export function LibraryMenuClose(props: Properties) {
  const { onClose } = props;

  return (
    <button className="library-menu-close" onClick={onClose} type="button">
      Close
    </button>
  );
}
