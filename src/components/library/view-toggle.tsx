import type { LibraryView } from "@/components/library/board-document";

interface Properties {
  view: LibraryView;
  onChange: (view: LibraryView) => void;
}

export function ViewToggle(props: Properties) {
  const { view, onChange } = props;

  return (
    <div className="view-toggle">
      <button aria-pressed={view === "grid"} onClick={() => onChange("grid")} type="button">
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          stroke="currentColor"
          strokeWidth="1.75"
          viewBox="0 0 16 16"
          width="16"
        >
          <rect height="4.5" rx="1" width="4.5" x="1.75" y="1.75" />
          <rect height="4.5" rx="1" width="4.5" x="9.75" y="1.75" />
          <rect height="4.5" rx="1" width="4.5" x="1.75" y="9.75" />
          <rect height="4.5" rx="1" width="4.5" x="9.75" y="9.75" />
        </svg>
        Grid
      </button>
      <button aria-pressed={view === "list"} onClick={() => onChange("list")} type="button">
        <svg
          aria-hidden="true"
          fill="none"
          height="16"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.75"
          viewBox="0 0 16 16"
          width="16"
        >
          <path d="M2 4h12" />
          <path d="M2 8h12" />
          <path d="M2 12h12" />
        </svg>
        List
      </button>
    </div>
  );
}
