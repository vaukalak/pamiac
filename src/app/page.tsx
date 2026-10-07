import type { Metadata } from "next";
import { AppHeader } from "@/components/header/app-header";
import { CircuitBoard } from "@/components/home/circuit-board";
import { HomeStage } from "@/components/home/home-stage";
import { appShareTarget } from "@/lib/share-preview";

export const metadata: Metadata = {
  alternates: {
    canonical: appShareTarget().url,
  },
};

export default function HomePage() {
  return (
    <div className="home">
      <CircuitBoard />
      <AppHeader />
      <main className="home-main">
        <HomeStage />
      </main>
      <footer className="home-foot">
        <p>Built for human ideas and machine intelligence.</p>
      </footer>
    </div>
  );
}
