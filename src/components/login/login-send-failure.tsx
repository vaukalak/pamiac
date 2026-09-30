interface Properties {
  happened: string;
}

export function LoginSendFailure(props: Properties) {
  const { happened } = props;

  return (
    <p className="error">
      {happened}
      <br />
      Try again, or use another address.
    </p>
  );
}
