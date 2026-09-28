interface Properties {
  title: string;
  detail: string;
}

export function ShareModeCopy(props: Properties) {
  const { title, detail } = props;

  return (
    <span>
      <strong>{title}</strong>
      <span>{detail}</span>
    </span>
  );
}
