"use client";

import { NoteNotifyTest } from "@/components/note-notify/note-notify-test";
import { Form } from "@/ui/Form";
import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  documentId: string;
}

export function NoteNotifyCriteria(props: Properties) {
  const { documentId } = props;

  return (
    <div className="note-notify-criteria">
      <Form.Textarea
        label="Condition"
        name="criteria"
        placeholder="Describe the condition you want Pamiac to watch for..."
        rows={4}
      />
      <Paragraph>Example: “A blocker is added or the launch date changes.”</Paragraph>
      <NoteNotifyTest documentId={documentId} />
    </div>
  );
}
