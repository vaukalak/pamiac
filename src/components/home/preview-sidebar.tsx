import { PreviewNavItem, type PreviewNavEntry } from "@/components/home/preview-nav-item";

const ENTRIES: PreviewNavEntry[] = [
  { icon: "home", label: "Home", tone: "active" },
  { icon: "notes", label: "Notes" },
  { icon: "canvas", label: "Diagrams" },
  { icon: "agent", label: "Agents" },
  { icon: "library", label: "Library", tone: "pinned" },
];

export function PreviewSidebar() {
  return (
    <div className="home-preview-side">
      {ENTRIES.map((entry) => (
        <PreviewNavItem key={entry.label} entry={entry} />
      ))}
    </div>
  );
}
