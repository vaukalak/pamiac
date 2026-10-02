import { Paragraph } from "@/ui/Paragraph";

interface Properties {
  text: string;
}

export function PublicNoteBlock(props: Properties) {
  const { text } = props;
  const parts = text.split(/(https:\/\/\S+)/);

  return (
    <Paragraph>
      {parts.map((part, index) =>
        part.startsWith("https://") ? (
          <a href={part} key={`${part}-${index}`}>
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </Paragraph>
  );
}
