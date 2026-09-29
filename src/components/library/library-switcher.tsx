export type LibraryPanel = "dashboard" | "manage";

interface Properties {
  mode: LibraryPanel;
  onMode: (mode: LibraryPanel) => void;
}

export function LibrarySwitcher(props: Properties) {
  const { mode, onMode } = props;

  return (
    <div aria-label="Library" className="library-switcher" role="group">
      <button
        aria-pressed={mode === "dashboard"}
        onClick={() => {
          onMode("dashboard");
        }}
        type="button"
      >
        Dashboard
      </button>
      <button
        aria-pressed={mode === "manage"}
        onClick={() => {
          onMode("manage");
        }}
        type="button"
      >
        Workspace management
      </button>
    </div>
  );
}
