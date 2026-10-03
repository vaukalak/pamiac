import Link from "next/link";

interface Properties {
  href: string;
}

export function ConsentSignIn(props: Properties) {
  const { href } = props;

  return (
    <section className="auth-card token-connect connect-consent">
      <p className="eyebrow">Connect</p>
      <h1>Sign in to connect</h1>
      <p>Connecting lets ChatGPT search, read, and edit this account&apos;s notes and diagrams.</p>
      <Link className="btn library-lime" href={href}>
        Sign in
      </Link>
    </section>
  );
}
