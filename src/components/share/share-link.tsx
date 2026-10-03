"use client";

import { useState } from "react";
import type { Visibility } from "@/lib/access";
import { Alert } from "@/ui/Alert";
import { Button } from "@/ui/Button";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  id: string;
  mode: Visibility;
  path?: "d" | "f";
}

export function ShareLink(props: Properties) {
  const { id, mode, path = "d" } = props;
  const [notice, setNotice] = useState("");
  if (mode === "private") return null;
  const link = `${window.location.origin}/${path}/${id}`;
  const label = path === "f" ? "Folder link" : "Document link";

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
      <Paragraph className="hint">{label}</Paragraph>
      <div className="dev-link">{link}</div>
      <Button className="secondary small" onClick={() => void copy()} type="button">
        Copy link
      </Button>
      {notice === "Link copied" ? <Paragraph className="hint">{notice}</Paragraph> : null}
      {notice === "Could not copy the link" ? <Alert>{notice}</Alert> : null}
    </div>
  );
}
