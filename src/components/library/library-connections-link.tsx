"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { LibraryPage } from "@/components/library/library-sidebar";
import { tokensQueryOptions } from "@/components/tokens/tokens-query";
import { liveConnectionCount } from "@/lib/sidebar-connections";

interface Properties {
  page: LibraryPage;
}

export function LibraryConnectionsLink(props: Properties) {
  const { page } = props;
  const tokens = useQuery(tokensQueryOptions());
  const count = tokens.data ? liveConnectionCount(tokens.data) : 0;
  const current = page === "connections";

  return (
    <Link
      aria-current={current ? "page" : undefined}
      className="library-nav-item"
      href="/workspace/tokens"
    >
      Connections
      {count > 0 ? <span className="library-nav-count">{count}</span> : null}
    </Link>
  );
}
