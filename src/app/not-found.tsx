import type { Metadata } from "next";
import { BrandHeader, BrandFooter } from "@/components/BrandHeader";

export const metadata: Metadata = {
  title: "Page introuvable | Fééti",
  robots: { index: false, follow: false },
};

const STORE_URL = (process.env.FEETI_STORE_URL || "https://feeti.io").replace(/\/$/, "");

export default function NotFound() {
  return (
    <div className="page">
      <BrandHeader />
      <main className="empty-state">
        <h1>Cette page n&apos;existe pas ou n&apos;est plus disponible</h1>
        <p className="muted">Le lien est peut-être erroné, ou l&apos;événement a été retiré par son organisateur.</p>
        <a className="btn-primary" href={`${STORE_URL}/events`}>Voir les événements sur Fééti</a>
      </main>
      <BrandFooter />
    </div>
  );
}
