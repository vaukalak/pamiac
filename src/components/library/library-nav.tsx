import type { LibraryFilter } from "@/components/library/board-document";
import { LibraryNavItem } from "@/components/library/library-nav-item";

interface Properties {
  filter: LibraryFilter;
  linked: boolean;
  onFilter: (filter: LibraryFilter) => void;
}

const ITEMS = [
  ["all", "Overview"],
  ["note", "Notes"],
  ["diagram", "Diagrams"],
] as const;

export function LibraryNav(props: Properties) {
  const { filter, linked, onFilter } = props;

  return (
    <nav aria-label="Library" className="library-nav">
      {ITEMS.map(([value, label]) => (
        <LibraryNavItem
          key={value}
          href={linked ? "/workspace" : undefined}
          label={label}
          onSelect={() => onFilter(value)}
          pressed={!linked && filter === value}
        />
      ))}
    </nav>
  );
}
