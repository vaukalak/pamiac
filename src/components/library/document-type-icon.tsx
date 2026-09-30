import type { DocumentType } from "@/lib/content";

interface Properties {
  type: DocumentType;
}

const PATH: Record<DocumentType, string> = {
  note: "M4 1.75h5.1L13 5.7V14.25H4z M9.1 1.75V5.7H13 M6.15 8.35h4.1 M6.15 10.85h4.1",
  diagram: "M3 2.25h10v11.5H3z M3 6h10 M3 9.35h10",
};

export function DocumentTypeIcon(props: Properties) {
  const { type } = props;
  const label = type === "note" ? "Note" : "Diagram";

  return (
    <svg
      aria-label={label}
      className="doc-type-icon"
      fill="none"
      height="16"
      role="img"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 16 16"
      width="16"
    >
      <path d={PATH[type]} />
    </svg>
  );
}
