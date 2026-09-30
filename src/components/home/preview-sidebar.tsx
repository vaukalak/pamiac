import { PreviewNavItem, type PreviewNavEntry } from "@/components/home/preview-nav-item";

const ENTRIES: PreviewNavEntry[] = [
  { icon: "home", label: "Home" },
  { icon: "notes", label: "Notes" },
  { icon: "canvas", label: "Diagrams" },
  { icon: "agent", label: "Agents" },
  { icon: "library", label: "Library", tone: "pinned" },
];

interface Properties {
  active: string;
}

function entryFor(entry: PreviewNavEntry, active: string): PreviewNavEntry {
  if (entry.tone === "pinned") return entry;
  if (entry.label === active) return { ...entry, tone: "active" };
  return entry;
}

export function PreviewSidebar(props: Properties) {
  const { active } = props;

  return (
    <div className="home-preview-side">
      {ENTRIES.map((entry) => (
        <PreviewNavItem key={entry.label} entry={entryFor(entry, active)} />
      ))}
    </div>
  );
}
