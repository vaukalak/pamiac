import { BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs } from "@blocknote/core";
import { createReactInlineContentSpec } from "@blocknote/react";
import { NoteWikiLink } from "@/components/note/note-wiki-link";

const noteLink = createReactInlineContentSpec(
  {
    type: "noteLink",
    propSchema: {
      title: { default: "" },
    },
    content: "none",
  },
  {
    render: NoteWikiLink,
  },
);

export const noteSchema = BlockNoteSchema.create({
  blockSpecs: defaultBlockSpecs,
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    noteLink,
  },
});
