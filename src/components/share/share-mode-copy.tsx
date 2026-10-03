interface Properties {
  detail: string;
  title: string;
}

export function ShareModeCopy(props: Properties) {
  const { detail, title } = props;

  return (
    <span className="share-mode-copy">
      <strong>{title}</strong>
      <span className="share-mode-detail">{detail}</span>
    </span>
  );
}
