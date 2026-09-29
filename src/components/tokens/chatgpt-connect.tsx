interface Properties {
  endpoint: string;
}

export function ChatGptConnect(props: Properties) {
  const { endpoint } = props;

  return (
    <section>
      <h2>ChatGPT</h2>
      <p>
        ChatGPT Free and Go use the Pamiac plugin from the plugin directory after this server is
        submitted there. Connecting signs in with the magic link and grants this library. No API key
        is pasted into ChatGPT.
      </p>
      <p>
        Publisher submission, and ChatGPT developer mode on Plus and above, use this MCP endpoint. A
        pasted MCP URL is developer mode, not the free tier.
      </p>
      <p className="hint">{endpoint}</p>
    </section>
  );
}
