import type { LibraryFilter } from "@/components/library/board-document";
import { FilterChip } from "@/components/library/filter-chip";

interface Properties {
  filter: LibraryFilter;
  onChange: (filter: LibraryFilter) => void;
}

const FILTERS = [
  ["all", "All"],
  ["note", "Notes"],
  ["diagram", "Diagrams"],
] as const;

export function LibraryFilters(props: Properties) {
  const { filter, onChange } = props;

  return (
    <div className="filters">
      {FILTERS.map(([value, label]) => (
        <FilterChip
          key={value}
          label={label}
          onSelect={() => onChange(value)}
          pressed={filter === value}
        />
      ))}
    </div>
  );
}
