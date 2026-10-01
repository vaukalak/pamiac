"use client";

import { useForm } from "react-hook-form";
import { NoteBlockCommentFormActions } from "@/components/note/note-block-comment-form-actions";
import { useNoteComments } from "@/components/note/note-comments";
import { Form } from "@/ui/Form";

interface CommentValues {
  text: string;
}

interface Properties {
  blockId: string;
  text: string;
}

export function NoteBlockCommentForm(props: Properties) {
  const { blockId, text } = props;
  const comments = useNoteComments();
  const form = useForm<CommentValues>({
    defaultValues: { text },
  });

  function submit(values: CommentValues) {
    const next = values.text.trim();
    if (!next) {
      form.setError("text", { message: "Write a comment" });
      return;
    }
    if (next.length > 400) {
      form.setError("text", { message: "Comment is too long" });
      return;
    }
    comments.save(blockId, next);
  }

  return (
    <Form.Context className="note-block-comment-card" form={form} onSubmit={submit}>
      <Form.Input label="Comment" name="text" type="text" />
      <NoteBlockCommentFormActions onCancel={comments.cancel} />
    </Form.Context>
  );
}
