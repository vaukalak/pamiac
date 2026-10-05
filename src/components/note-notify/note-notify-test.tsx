"use client";

import { useMutation } from "@tanstack/react-query";
import { useFormContext } from "react-hook-form";
import type { NoteNotifyDraft } from "@/components/note-notify/note-notify-draft";
import { NoteNotifyTestResult } from "@/components/note-notify/note-notify-test-result";
import { CRITERIA_VERDICT_COPY, type CriteriaVerdict } from "@/lib/note-notify";
import { Button } from "@/ui/Button";

interface Properties {
  documentId: string;
}

function isVerdict(value: unknown): value is CriteriaVerdict {
  return value === "matches" || value === "misses" || value === "future";
}

async function testCriteria(documentId: string, criteria: string) {
  const response = await fetch(`/api/documents/${documentId}/notification/test`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ criteria }),
  }).catch(() => null);
  const body = (response ? await response.json().catch(() => null) : null) as {
    error?: string;
    result?: unknown;
  } | null;
  if (!response || !response.ok || !body || !isVerdict(body.result)) {
    throw new Error(body?.error ?? "Could not test this condition");
  }
  return { result: body.result };
}

export function NoteNotifyTest(props: Properties) {
  const { documentId } = props;
  const { getValues, setError } = useFormContext<NoteNotifyDraft>();
  const test = useMutation({
    mutationFn: (criteria: string) => testCriteria(documentId, criteria),
  });
  const result = test.isSuccess ? CRITERIA_VERDICT_COPY[test.data.result] : "";
  const error = test.error instanceof Error ? test.error.message : "";

  function onTest() {
    if (test.isPending) return;
    const criteria = getValues("criteria").trim();
    if (!criteria) {
      setError("criteria", { message: "Describe the condition" });
      return;
    }
    test.mutate(criteria);
  }

  return (
    <div className="note-notify-test">
      <Button className="secondary" disabled={test.isPending} onClick={onTest} type="button">
        {test.isPending ? "Testing…" : "Test criteria"}
      </Button>
      <NoteNotifyTestResult error={error} result={result} />
    </div>
  );
}
