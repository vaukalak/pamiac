import { AppHeader } from "@/components/header/app-header";
import { HomeFeatures } from "@/components/home/home-features";
import { Paragraph } from "@/ui/Paragraph";

export default function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="hero">
        <HomeFeatures>
          <p className="eyebrow">Notes, UML, and agents</p>
          <h1>A desk for diagrams that an agent can read.</h1>
          <Paragraph className="lede">
            We email you a link to sign in, draw UML, and write notes you can drag into shape. Every
            document has a direct link. Share it by email, password, or in public, and give an agent
            a token so it can search and edit your library.
          </Paragraph>
        </HomeFeatures>
      </main>
    </>
  );
}
