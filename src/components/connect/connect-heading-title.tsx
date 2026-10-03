interface Properties {
  badge?: string;
  title: string;
  titleId?: string;
}

export function ConnectHeadingTitle(props: Properties) {
  const { badge, title, titleId } = props;

  return (
    <div className="token-connect-title">
      <h2 id={titleId}>{title}</h2>
      {badge ? <span className="token-connect-badge">{badge}</span> : null}
    </div>
  );
}
