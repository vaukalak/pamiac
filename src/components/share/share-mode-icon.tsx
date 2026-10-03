interface Properties {
  name: "globe" | "key" | "lock" | "mail";
}

const PATHS = {
  globe:
    "M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-8 8h16M12 4c2.2 2.4 3.3 5.2 3.3 8s-1.1 5.6-3.3 8c-2.2-2.4-3.3-5.2-3.3-8s1.1-5.6 3.3-8Z",
  key: "M15.5 7.5a4 4 0 1 1-3.2 6.4L7 19.2 4.8 17l1.4-1.4L4.8 14.2 7 12l5.2-1.1a4 4 0 0 1 3.3-3.4Z",
  lock: "M8 11V8a4 4 0 0 1 8 0v3M7 11h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z",
  mail: "M4 7h16v10H4V7Zm0 0 8 6 8-6",
} as const;

export function ShareModeIcon(props: Properties) {
  const { name } = props;

  return (
    <svg aria-hidden="true" className="share-mode-icon" focusable="false" viewBox="0 0 24 24">
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}
