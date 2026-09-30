import { AppHeader } from "@/components/header/app-header";
import { CircuitBoard } from "@/components/home/circuit-board";
import { HomeFeatures } from "@/components/home/home-features";
import { HomeHero } from "@/components/home/home-hero";
import { WorkspacePreview } from "@/components/home/workspace-preview";

export default function HomePage() {
  return (
    <div className="home">
      <CircuitBoard />
      <AppHeader />
      <main className="home-main">
        <section className="home-hero">
          <HomeHero />
          <WorkspacePreview />
        </section>
        <HomeFeatures />
      </main>
      <footer className="home-foot">
        <p>Built for human ideas and machine intelligence.</p>
      </footer>
    </div>
  );
}
