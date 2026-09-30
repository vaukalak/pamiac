export function RichNotesPicture() {
  return (
    <svg aria-label="Note page with a title and text blocks" role="img" viewBox="0 0 520 400">
      <rect fill="var(--paper)" height="400" rx="28" width="520" />
      <rect
        fill="var(--card)"
        height="320"
        rx="18"
        stroke="var(--line)"
        width="400"
        x="60"
        y="40"
      />
      <text fill="var(--ink)" fontFamily="var(--serif)" fontSize="28" x="88" y="96">
        Field walk
      </text>
      <rect fill="var(--teal)" height="4" rx="2" width="72" x="88" y="112" />
      <rect fill="var(--paper-deep)" height="56" rx="10" width="344" x="88" y="136" />
      <rect fill="var(--ink-soft)" height="8" rx="4" width="240" x="104" y="156" />
      <rect fill="var(--line)" height="8" rx="4" width="180" x="104" y="172" />
      <rect
        fill="var(--card)"
        height="72"
        rx="10"
        stroke="var(--teal)"
        width="344"
        x="88"
        y="208"
      />
      <rect fill="var(--ink)" height="8" rx="4" width="200" x="104" y="230" />
      <rect fill="var(--ink-soft)" height="8" rx="4" width="260" x="104" y="248" />
      <rect fill="var(--paper-deep)" height="48" rx="10" width="220" x="88" y="296" />
      <rect fill="var(--ink-soft)" height="8" rx="4" width="140" x="104" y="316" />
    </svg>
  );
}
