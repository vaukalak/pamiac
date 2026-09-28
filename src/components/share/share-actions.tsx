interface Properties {
  error: string;
  message: string;
  pending: boolean;
  onSave: () => void;
}

export function ShareActions(props: Properties) {
  const { error, message, pending, onSave } = props;

  return (
    <div className="share-actions">
      <button className="btn" disabled={pending} onClick={onSave} type="button">
        {pending ? "Saving…" : "Save sharing"}
      </button>
      {message ? (
        <p aria-live="polite" className="hint">
          {message}
        </p>
      ) : null}
      {error ? (
        <p aria-live="polite" className="error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
