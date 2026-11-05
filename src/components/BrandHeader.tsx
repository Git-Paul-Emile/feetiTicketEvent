import type { ReactNode } from "react";

const STORE_URL = (process.env.FEETI_STORE_URL || "https://feeti.io").replace(/\/$/, "");

/** Bandeau supérieur commun : logo officiel Fééti (retour au site) et action à droite. */
export function BrandHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="topbar">
      <a className="brand" href={STORE_URL} aria-label="Fééti, retour au site principal">
        {/* Logo officiel (identique au site Fééti) */}
        <img src="/brand/feeti-logo.png" alt="Fééti" width={1309} height={372} />
      </a>
      {children}
    </header>
  );
}

/** Pied de page commun : logo blanc, mention de la billetterie et liens légaux du site principal. */
export function BrandFooter() {
  return (
    <footer className="site-footer">
      <img className="site-footer-logo" src="/brand/feeti-logo-blanc.png" alt="Fééti" width={997} height={307} loading="lazy" />
      <p>Billetterie opérée par Fééti. Paiement uniquement via le paiement sécurisé Fééti.</p>
      <nav aria-label="Informations légales">
        <a href={`${STORE_URL}/legal/terms`}>CGU</a>
        <a href={`${STORE_URL}/legal/privacy`}>Confidentialité</a>
        <a href={`${STORE_URL}/legal/refund`}>Remboursement</a>
        <a href={`${STORE_URL}/contact`}>Contact</a>
      </nav>
    </footer>
  );
}
