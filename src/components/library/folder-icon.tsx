interface Properties {
  size: "title" | "picture";
}

export function FolderIcon(props: Properties) {
  const { size } = props;
  const picture = size === "picture";
  const px = picture ? 48 : 16;

  return (
    <svg
      aria-label="Folder"
      className={picture ? "folder-picture-icon" : "doc-type-icon"}
      fill="none"
      height={px}
      role="img"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 16 16"
      width={px}
    >
      <path d="M2.25 4.6h3.55l1.2 1.45H13.75V12.6H2.25z" />
    </svg>
  );
}
