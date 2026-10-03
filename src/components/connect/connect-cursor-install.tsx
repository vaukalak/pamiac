import { cursorInstallUrl } from "@/lib/connect-platforms";

export function ConnectCursorInstall() {
  return (
    <a className="btn library-lime" href={cursorInstallUrl()}>
      Add Pamiac to Cursor
    </a>
  );
}
