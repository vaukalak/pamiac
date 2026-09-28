import Link from "next/link";
import { AppHeader } from "@/components/header/app-header";

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="hero">
        <div>
          <p className="eyebrow">Notes, UML, and agents</p>
          <h1>A desk for diagrams that an agent can read.</h1>
          <p className="lede">
            Sign in with a magic link, draw UML, and write notes you can drag into shape. Every
            document has a direct link. Share it by email, password, or in public, and give an agent
            a token so it can search and edit your library.
          </p>
          <div className="hero-actions">
            <Link className="btn" href="/login">
              Continue with email
            </Link>
            <Link className="btn secondary" href="/workspace">
              Open the library
            </Link>
          </div>
        </div>
        <div className="feature-grid">
          <article className="feature">
            <strong>UML canvas</strong>
            <p>Classes, actors, use cases, and relations you can drag, connect, and inspect.</p>
          </article>
          <article className="feature">
            <strong>Rich notes</strong>
            <p>A block editor for markdown, with drag-and-drop sections inside the note.</p>
          </article>
          <article className="feature">
            <strong>Agent token</strong>
            <p>One secret lets an agent search embeddings and create or update your documents.</p>
          </article>
        </div>
      </main>
    </>
  );
}
