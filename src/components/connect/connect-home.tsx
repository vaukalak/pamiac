import type { ReactNode } from "react";
import { AppHeader } from "@/components/header/app-header";
import { CircuitBoard } from "@/components/home/circuit-board";
import { ConnectHomeFoot } from "@/components/connect/connect-home-foot";
import { ConnectHomeMain } from "@/components/connect/connect-home-main";

interface Properties {
  children: ReactNode;
  email: string;
}

export function ConnectHome(props: Properties) {
  const { children, email } = props;

  return (
    <div className="home">
      <CircuitBoard />
      <AppHeader email={email} />
      <ConnectHomeMain>{children}</ConnectHomeMain>
      <ConnectHomeFoot />
    </div>
  );
}
