"use client";

import { useRouter } from "next/navigation";

interface Properties {
  id: string;
  onShare: () => void;
}

export function DocumentOwnerActions(props: Properties) {
  const { id, onShare } = props;
  const router = useRouter();

  async function remove() {
    if (!window.confirm("Delete this document?")) return;
    const response = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (response.ok) router.push("/workspace");
  }

  return (
    <div className="row-actions">
      <button className="btn secondary small" onClick={onShare} type="button">
        Share
      </button>
      <button className="btn danger small" onClick={() => void remove()} type="button">
        Delete
      </button>
    </div>
  );
}
