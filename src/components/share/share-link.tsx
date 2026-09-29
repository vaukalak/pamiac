"use client";

import { useState } from "react";
import type { Visibility } from "@/lib/access";

interface Properties {
  id: string;
  mode: Visibility;
}

export function ShareLink(props: Properties) {
  const { id, mode } = props;
  const [notice, setNotice] = useState("");
  if (mode === "private") return null;
  const link = `${window.location.origin}/d/${id}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Link copied");
    } catch {
      setNotice("Could not copy the link");
    }
  }

  return (
    <div className="share-link">
      <p className="hint">Document link</p>
      <div className="dev-link">{link}</div>
      <button className="btn secondary small" onClick={() => void copy()} type="button">
        Copy link
      </button>
      {notice ? (
        <p aria-live="polite" className={notice === "Link copied" ? "hint" : "error"}>
          {notice}
        </p>
      ) : null}
    </div>
  );
}
