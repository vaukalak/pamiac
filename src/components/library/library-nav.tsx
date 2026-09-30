import type { LibraryFilter } from "@/components/library/board-document";
import { LibraryNavItem } from "@/components/library/library-nav-item";

interface Properties {
  filter: LibraryFilter;
  onFilter: (filter: LibraryFilter) => void;
}

const ITEMS = [
  ["all", "Overview"],
  ["note", "Notes"],
  ["diagram", "Diagrams"],
] as const;

export function LibraryNav(props: Properties) {
  const { filter, onFilter } = props;

  return (
    <nav aria-label="Library" className="library-nav">
      {ITEMS.map(([value, label]) => (
        <LibraryNavItem
          key={value}
          label={label}
          onSelect={() => onFilter(value)}
          pressed={filter === value}
        />
      ))}
    </nav>
  );
}
