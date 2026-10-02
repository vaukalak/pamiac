import type { ReactNode } from "react";
import { Page } from "@/ui/Page";

interface Properties {
  children: ReactNode;
}

export function ConnectHomeMain(props: Properties) {
  const { children } = props;

  return <Page className="home-sign-in">{children}</Page>;
}
