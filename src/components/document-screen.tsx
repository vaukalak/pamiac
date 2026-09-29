"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { DocumentOwnerActions } from "@/components/document/document-owner-actions";
import { NoteDocument } from "@/components/document/note-document";
import { ShareModal } from "@/components/share/share-modal";
import type { Visibility } from "@/lib/access";
import { defaultTitle } from "@/lib/content";
import type { DiagramContent } from "@/lib/diagram";

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

function saveLabel(canEdit: boolean, status: "saved" | "saving" | "error") {
  if (!canEdit) return "View only";
  if (status === "saving") return "Saving…";
  if (status === "error") return "Not saved";
  return "Saved";
}

function noteName(title: string) {
  return title === defaultTitle("note") ? "" : title;
}

export function DocumentScreen(props: Properties) {
  const { id, type, title, content, visibility, emails, hasPassword, canEdit } = props;
  const router = useRouter();
  const [name, setName] = useState(type === "note" ? noteName(title) : title);
  const [status, setStatus] = useState<"saved" | "saving" | "error">("saved");
  const [sharing, setSharing] = useState(false);
  const [shareState, setShareState] = useState({ visibility, emails, hasPassword });
  const timer = useRef<number | null>(null);
  const latest = useRef<{ title: string; content?: unknown }>({ title });
  const persistedTitle = useRef(title);
  const contentDirty = useRef(false);

  function schedule(partial: { title?: string; content?: unknown }) {
    latest.current = { ...latest.current, ...partial };
    if ("content" in partial) contentDirty.current = true;
    if (!canEdit) return;
    setStatus("saving");
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      const payload = latest.current;
      const response = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setStatus("error");
        return;
      }
      if (payload.title) persistedTitle.current = payload.title;
      if (!timer.current) contentDirty.current = false;
      setStatus(timer.current ? "saving" : "saved");
    }, 700);
  }

  function commitTitle(value: string) {
    setName(value);
    const trimmed = value.trim();
    if (!trimmed || trimmed === persistedTitle.current) {
      latest.current = { ...latest.current, title: persistedTitle.current };
      if (!contentDirty.current && timer.current) {
        window.clearTimeout(timer.current);
        timer.current = null;
        setStatus((current) => (current === "error" ? current : "saved"));
      }
      return;
    }
    schedule({ title: trimmed });
  }

  function restoreTitle() {
    if (name.trim()) return;
    const persisted = persistedTitle.current;
    setName(persisted === defaultTitle("note") ? "" : persisted);
  }

  const wide = type === "diagram";

  return (
    <>
      <div className={wide ? "topbar wide" : "topbar"}>
        {type === "note" ? (
          <Link className="library-link" href="/workspace">
            Library
          </Link>
        ) : (
          <div className="diagram-heading">
            <Link className="hint" href="/workspace">
              Library
            </Link>
            <input
              aria-label="Title"
              className="title-input"
              disabled={!canEdit}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                schedule({ title: event.target.value });
              }}
            />
          </div>
        )}
        <div className="topbar-tools">
          <span className="save-state">{saveLabel(canEdit, status)}</span>
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
            title={name}
            onContent={(markdown) => schedule({ content: markdown })}
            onTitle={commitTitle}
            onTitleBlur={restoreTitle}
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
