"use client";

import { Button } from "@/ui/Button";

interface Properties {
  onChoose: (title: string) => void;
  title: string;
}

export function NotePageChoice(props: Properties) {
  const { onChoose, title } = props;

  return (
    <li>
      <Button className="secondary" onClick={() => onChoose(title)}>
        {title}
      </Button>
    </li>
  );
}
