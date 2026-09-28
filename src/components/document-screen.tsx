"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { DocumentOwnerActions } from "@/components/document/document-owner-actions";
import { ShareModal } from "@/components/share/share-modal";
import type { Visibility } from "@/lib/access";
import type { DiagramContent } from "@/lib/diagram";

const NoteEditor = dynamic(() => import("@/components/note-editor").then((mod) => mod.NoteEditor), {
  ssr: false,
});
const UmlEditor = dynamic(() => import("@/components/uml-editor").then((mod) => mod.UmlEditor), {
  ssr: false,
});

interface Properties {
  id: string;
  type: "note" | "diagram";
  title: string;
  content: string;
  visibility: Visibility;
  emails: string[];
  hasPassword: boolean;
  canEdit: boolean;
}

export function DocumentScreen(props: Properties) {
  const { id, type, title, content, visibility, emails, hasPassword, canEdit } = props;
  const router = useRouter();
  const [name, setName] = useState(title);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [sharing, setSharing] = useState(false);
  const [shareState, setShareState] = useState({ visibility, emails, hasPassword });
  const timer = useRef<number | null>(null);
  const latest = useRef<{ title: string; content?: unknown }>({ title });

  function schedule(partial: { title?: string; content?: unknown }) {
    latest.current = { ...latest.current, ...partial };
    if (!canEdit) return;
    setStatus("saving");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const response = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latest.current),
      });
      setStatus(response.ok ? "saved" : "error");
    }, 700);
  }

  const wide = type === "diagram";

  return (
    <>
      <div className={wide ? "topbar wide" : "topbar"}>
        <div style={{ flex: 1 }}>
          <Link className="hint" href="/workspace">
            Library
          </Link>
          <input
            className="title-input"
            value={name}
            disabled={!canEdit}
            aria-label="Title"
            onChange={(event) => {
              setName(event.target.value);
              schedule({ title: event.target.value });
            }}
          />
        </div>
        <span className="save-state">
          {canEdit
            ? status === "saving"
              ? "Saving…"
              : status === "error"
                ? "Not saved"
                : "Saved"
            : "View only"}
        </span>
        {canEdit ? (
          <DocumentOwnerActions id={id} onShare={() => setSharing(true)} />
        ) : (
          <span className="badge">{shareState.visibility}</span>
        )}
      </div>
      <div className={wide ? "editor-shell wide" : "editor-shell"}>
        {type === "note" ? (
          <NoteEditor
            editable={canEdit}
            initial={content}
            onChange={(markdown) => schedule({ content: markdown })}
          />
        ) : (
          <UmlEditor
            editable={canEdit}
            initial={content}
            onChange={(diagram: DiagramContent) => schedule({ content: diagram })}
          />
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
        />
      ) : null}
    </>
  );
}
