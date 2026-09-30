"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DiagramChrome } from "@/components/document/diagram-chrome";
import { DocumentBreadcrumb } from "@/components/document/document-breadcrumb";
import { DocumentOwnerActions } from "@/components/document/document-owner-actions";
import { NoteDocument } from "@/components/document/note-document";
import { SaveState } from "@/components/document/save-state";
import { ShareModal } from "@/components/share/share-modal";
import type { Visibility } from "@/lib/access";
import { Page } from "@/ui/Page";

const UmlEditor = dynamic(() => import("@/components/uml-editor").then((mod) => mod.UmlEditor), {
  ssr: false,
});

interface Properties {
  id: string;
  type: "note" | "diagram";
  title: string;
  content: string;
  version: number;
  visibility: Visibility;
  emails: string[];
  hasPassword: boolean;
  workspaceId: string | null;
  canEdit: boolean;
  isOwner: boolean;
  spaceName: string | null;
}

export function DocumentScreen(props: Properties) {
  const {
    id,
    type,
    title,
    content,
    version,
    visibility,
    emails,
    hasPassword,
    workspaceId,
    canEdit,
    isOwner,
    spaceName,
  } = props;
  const router = useRouter();
  const [sharing, setSharing] = useState(false);
  const [shareState, setShareState] = useState({ visibility, emails, hasPassword, workspaceId });
  const crumb = <DocumentBreadcrumb kind={type} spaceName={spaceName} />;
  const tools = (
    <div className="library-heading-actions topbar-tools">
      <SaveState canEdit={canEdit} id={id} />
      {isOwner ? (
        <DocumentOwnerActions id={id} onShare={() => setSharing(true)} />
      ) : (
        <span className="badge">{shareState.visibility}</span>
      )}
    </div>
  );

  return (
    <Page className="library-main">
      {type === "note" ? (
        <NoteDocument
          canEdit={canEdit}
          content={content}
          crumb={crumb}
          id={id}
          title={title}
          tools={tools}
          version={version}
        />
      ) : (
        <DiagramChrome
          canEdit={canEdit}
          crumb={crumb}
          id={id}
          title={title}
          tools={tools}
          version={version}
        />
      )}
      {type === "diagram" ? (
        <div className="editor-shell wide">
          <UmlEditor editable={canEdit} id={id} initial={content} version={version} />
        </div>
      ) : null}
      {sharing ? (
        <ShareModal
          emails={shareState.emails}
          hasPassword={shareState.hasPassword}
          id={id}
          onClose={() => {
            setSharing(false);
            router.refresh();
          }}
          onSaved={(share) => setShareState(share)}
          visibility={shareState.visibility}
          workspaceId={shareState.workspaceId}
        />
      ) : null}
    </Page>
  );
}
