"use client";

import { Form } from "@/ui/Form";
import { Paragraph } from "@/ui/Paragraph";

export function NoteNotifyCriteria() {
  return (
    <div className="note-notify-criteria">
      <Form.Textarea
        label="Condition"
        name="criteria"
        placeholder="Describe the condition you want Pamiac to watch for..."
        rows={4}
      />
      <Paragraph>Example: “A blocker is added or the launch date changes.”</Paragraph>
    </div>
  );
}
