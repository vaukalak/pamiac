"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Properties {
  className?: string;
}

export function LibraryConnectLink(props: Properties) {
  const { className } = props;
  const pathname = usePathname();
  const current = pathname === "/workspace/tokens";

  return (
    <Link
      aria-current={current ? "page" : undefined}
      className={className ?? "library-rail-link"}
      href="/workspace/tokens"
    >
      Connect agent
    </Link>
  );
}
