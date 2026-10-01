interface Properties {
  onClose: () => void;
}

export function LibraryMenuBackdrop(props: Properties) {
  const { onClose } = props;

  return <div aria-hidden="true" className="library-menu-backdrop" onClick={onClose} />;
}
