import type { LibraryFilter } from "@/components/library/board-document";
import { FilterChip } from "@/components/library/filter-chip";

interface Properties {
  counts: Record<LibraryFilter, number>;
  filter: LibraryFilter;
  onChange: (filter: LibraryFilter) => void;
}

const FILTERS = [
  ["all", "All"],
  ["note", "Notes"],
  ["diagram", "Diagrams"],
] as const;

export function LibraryFilters(props: Properties) {
  const { counts, filter, onChange } = props;

  return (
    <div aria-label="Document types" className="filters" role="group">
      {FILTERS.map(([value, label]) => (
        <FilterChip
          count={counts[value]}
          key={value}
          label={label}
          onSelect={() => onChange(value)}
          pressed={filter === value}
        />
      ))}
    </div>
  );
}
