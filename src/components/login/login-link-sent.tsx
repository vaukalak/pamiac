interface Properties {
  address: string;
  devUrl: string | null;
  onChooseDifferentEmail: () => void;
}

export function LoginLinkSent(props: Properties) {
  const { address, devUrl, onChooseDifferentEmail } = props;

  return (
    <div className="form-stack login-sent">
      <h2>Check your email</h2>
      <p className="hint">
        We sent a link to {address}.
        <br />
        Check your inbox, then spam, then promotions,
        <br />
        and it can take a minute.
      </p>
      {devUrl ? (
        <a className="dev-link" href={devUrl}>
          Development only: open the link
        </a>
      ) : null}
      <button className="btn ghost" onClick={onChooseDifferentEmail} type="button">
        Use a different email
      </button>
    </div>
  );
}
