"use client";

import { useEffect, useRef } from "react";

interface Properties {
  value: string;
  disabled: boolean;
  onBlur: () => void;
  onChange: (value: string) => void;
}

export function NoteTitle(props: Properties) {
  const { value, disabled, onBlur, onChange } = props;
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const element = field.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  return (
    <h1 className="note-title">
      <textarea
        ref={field}
        aria-label="Title"
        className="note-title-input"
        disabled={disabled}
        maxLength={160}
        placeholder="Untitled note"
        rows={1}
        value={value}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.preventDefault();
        }}
      />
    </h1>
  );
}
