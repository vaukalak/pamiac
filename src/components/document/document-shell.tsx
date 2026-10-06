"use client";

import type { ReactNode } from "react";
import { DocumentSidebar } from "@/components/document/document-sidebar";
import { CircuitBoard } from "@/components/home/circuit-board";
import { LibraryBrand } from "@/components/library/library-brand";
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
      {email === null ? <LibraryBrand href="/" /> : null}
      {email !== null ? (
        <DocumentSidebar
          documentType={documentType}
          email={email}
          workspaceId={workspaceId}
          workspaces={workspaces}
        />
      ) : null}
      {children}
    </div>
  );
}
