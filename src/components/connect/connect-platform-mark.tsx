import type { ConnectPlatformId } from "@/lib/connect-platforms";

interface Properties {
  id: ConnectPlatformId | "pamiac";
}

export function ConnectPlatformMark(props: Properties) {
  const { id } = props;

  return (
    <span aria-hidden="true" className={`token-connect-mark token-connect-mark-${id}`}>
      {id === "pamiac" ? (
        <svg viewBox="0 0 32 32">
          <path d="M16 3 27 9.2v13.6L16 29 5 22.8V9.2L16 3Z" />
          <path d="M16 10.2 21.2 13.1v5.8L16 21.8 10.8 18.9v-5.8L16 10.2Z" />
        </svg>
      ) : null}
      {id === "cursor" ? (
        <svg viewBox="0 0 32 32">
          <path d="M16 5 26 10.5v11L16 27 6 21.5v-11L16 5Z" />
          <path d="M16 5v11l10 5.5M16 16 6 21.5" />
        </svg>
      ) : null}
      {id === "claude" ? (
        <svg viewBox="0 0 32 32">
          <path d="M16 4.5 18.2 13 27 16l-8.8 3L16 27.5 13.8 19 5 16l8.8-3L16 4.5Z" />
        </svg>
      ) : null}
      {id === "chatgpt" ? (
        <svg viewBox="0 0 32 32">
          <path d="M16 6.5a4.2 4.2 0 0 1 3.8 2.4 4.2 4.2 0 0 1 3.5 5.6 4.2 4.2 0 0 1-1.2 6.4 4.2 4.2 0 0 1-6.1 2.6 4.2 4.2 0 0 1-6.1-2.6 4.2 4.2 0 0 1-1.2-6.4 4.2 4.2 0 0 1 3.5-5.6A4.2 4.2 0 0 1 16 6.5Z" />
          <circle cx="16" cy="16" r="2.2" />
        </svg>
      ) : null}
      {id === "gemini" ? (
        <svg viewBox="0 0 32 32">
          <path d="M16 4 18.4 13.6 28 16l-9.6 2.4L16 28l-2.4-9.6L4 16l9.6-2.4L16 4Z" />
        </svg>
      ) : null}
      {id === "grok" ? (
        <svg viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="9" />
          <path d="M10.5 21.5 21.5 10.5" />
        </svg>
      ) : null}
      {id === "deepseek" ? (
        <svg viewBox="0 0 32 32">
          <path d="M7 18c2.5-7 8-11 14-9 3 .8 5 3.2 5 6.2 0 4.4-4.2 7.3-9.2 7.3H12l-2.2 4.2" />
          <path d="M12 18.5h6.5" />
        </svg>
      ) : null}
      {id === "other" ? (
        <svg viewBox="0 0 32 32">
          <circle cx="8" cy="16" r="2" />
          <circle cx="16" cy="16" r="2" />
          <circle cx="24" cy="16" r="2" />
        </svg>
      ) : null}
    </span>
  );
}
