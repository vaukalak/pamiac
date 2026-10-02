import { PublicNoteBlock } from "@/components/public-note/public-note-block";

interface Properties {
  markdown: string;
}

export function PublicNoteBody(props: Properties) {
  const { markdown } = props;
  const blocks = markdown
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  return (
    <div className="note-sheet">
      {blocks.map((block) => (
        <PublicNoteBlock key={block} text={block} />
      ))}
    </div>
  );
}
