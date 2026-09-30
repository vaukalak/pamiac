interface Properties {
  count: number;
}

export function LibraryStatus(props: Properties) {
  const { count } = props;
  const noun = count === 1 ? "document" : "documents";

  return (
    <p className="library-status">
      {count} {noun} in this space
    </p>
  );
}
