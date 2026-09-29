const publishers = new WeakMap<object, () => void>();

export function bindNoteMarkdownPublisher(editor: object, publish: () => void) {
  publishers.set(editor, publish);
  return () => {
    if (publishers.get(editor) === publish) publishers.delete(editor);
  };
}

export function publishNoteMarkdown(editor: object) {
  publishers.get(editor)?.();
}
