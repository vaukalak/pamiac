"use client";

import type { ReactNode } from "react";
import { DocumentSidebar } from "@/components/document/document-sidebar";
import { ProfileMenu } from "@/components/header/profile-menu";
import { CircuitBoard } from "@/components/home/circuit-board";
import type { NamedWorkspace } from "@/lib/library-spaces";

interface Properties {
  children: ReactNode;
  documentType: "note" | "diagram";
  email: string | null;
  workspaceId: string | null;
  workspaces: NamedWorkspace[];
}

export function DocumentShell(props: Properties) {
  const { children, documentType, email, workspaceId, workspaces } = props;
  const signedIn = email !== null;
  const shell = signedIn ? "library-shell" : "library-shell library-shell-solo";

  return (
    <div className={shell}>
      <CircuitBoard />
      {signedIn ? (
        <DocumentSidebar
          documentType={documentType}
          workspaceId={workspaceId}
          workspaces={workspaces}
        />
      ) : null}
      {email ? <ProfileMenu email={email} /> : null}
      {children}
    </div>
  );
}
