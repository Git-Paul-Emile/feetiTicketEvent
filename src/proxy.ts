import { NextResponse, type NextRequest } from "next/server";

/**
 * Routage par sous-domaine : kora-fest-2026.feeti.io/ → /e/kora-fest-2026 (réécriture interne).
 * En local : kora-fest-2026.localhost:3100 (Chrome/Edge résolvent *.localhost sans DNS).
 */
const ROOT_DOMAIN = (process.env.EVENT_PAGES_ROOT_DOMAIN || "feeti.io").toLowerCase();
const STORE_URL = process.env.FEETI_STORE_URL || `https://${ROOT_DOMAIN}`;
const NON_EVENT_SUBDOMAINS = new Set(["www", "app", "api", "play", "store", "admin"]);
const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

function subdomainOf(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();
  for (const root of [ROOT_DOMAIN, "localhost"]) {
    if (hostname.endsWith(`.${root}`)) {
      const label = hostname.slice(0, -(root.length + 1));
      return LABEL.test(label) ? label : null; // un seul niveau : a.b.feeti.io refusé
    }
  }
  return null;
}

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const sub = subdomainOf(host);
  const { pathname } = request.nextUrl;

  if (!sub || NON_EVENT_SUBDOMAINS.has(sub)) {
    // Domaine racine ou URL de déploiement : /e/{slug} reste accessible (aperçus Vercel),
    // le reste renvoie vers le site principal.
    if (pathname.startsWith("/e/")) return NextResponse.next();
    return NextResponse.redirect(STORE_URL, 307);
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/e/${sub}`;
    return NextResponse.rewrite(url);
  }
  // Une page = une URL : tout autre chemin du sous-domaine renvoie à sa racine
  if (!pathname.startsWith("/e/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = {
  // Exclut les fichiers techniques ; robots.txt / favicon servis tels quels
  matcher: ["/((?!_next/|favicon\\.ico|robots\\.txt|icon\\.svg|.*\\.(?:png|jpg|jpeg|webp|svg|css|js)$).*)"],
};
