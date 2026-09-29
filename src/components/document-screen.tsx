"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DiagramTitle } from "@/components/document/diagram-title";
import { DocumentOwnerActions } from "@/components/document/document-owner-actions";
import { NoteDocument } from "@/components/document/note-document";
import { SaveState } from "@/components/document/save-state";
import { ShareModal } from "@/components/share/share-modal";
import type { Visibility } from "@/lib/access";

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
  } = props;
  const router = useRouter();
  const [sharing, setSharing] = useState(false);
  const [shareState, setShareState] = useState({ visibility, emails, hasPassword, workspaceId });
  const wide = type === "diagram";

  return (
    <>
      <div className={wide ? "topbar wide" : "topbar"}>
        {type === "note" ? (
          <Link className="library-link" href="/workspace">
            Library
          </Link>
        ) : (
          <DiagramTitle canEdit={canEdit} id={id} title={title} version={version} />
        )}
        <div className="topbar-tools">
          <SaveState canEdit={canEdit} id={id} />
          {canEdit ? (
            <DocumentOwnerActions id={id} onShare={() => setSharing(true)} />
          ) : (
            <span className="badge">{shareState.visibility}</span>
          )}
        </div>
      </div>
      <div className={wide ? "editor-shell wide" : "editor-shell"}>
        {type === "note" ? (
          <NoteDocument
            canEdit={canEdit}
            content={content}
            id={id}
            title={title}
            version={version}
          />
        ) : (
          <UmlEditor editable={canEdit} id={id} initial={content} version={version} />
        )}
      </div>
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
    </>
  );
}
