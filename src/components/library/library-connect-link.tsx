import Link from "next/link";

interface Properties {
  className?: string;
}

export function LibraryConnectLink(props: Properties) {
  const { className } = props;

  return (
    <Link className={className ?? "library-rail-link"} href="/workspace/tokens">
      Connect agent
    </Link>
  );
}
