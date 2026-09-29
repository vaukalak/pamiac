"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { createQueryClient } from "@/lib/query-client";

interface Properties {
  children: ReactNode;
}

export function QueryProvider(props: Properties) {
  const { children } = props;
  const [client] = useState(createQueryClient);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
