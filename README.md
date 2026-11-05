# FeetiEventPages : pages événement `{slug}.feeti.io`

Application Next.js 16 (App Router, rendu serveur) qui sert une mini-vitrine publique par événement. Les données viennent de l'API FeetiTicket : `GET /api/public/events/by-slug/:slug`. Le cache de données (ISR) dure 60 s et chaque page porte le tag `event-page:{slug}`.

- `src/proxy.ts` : lit le sous-domaine (`kora-fest-2026.feeti.io` ou `kora-fest-2026.localhost`) et réécrit la requête vers `/e/kora-fest-2026`. Tout autre chemin du sous-domaine renvoie à sa racine. Le domaine racine renvoie vers Store.
- `src/app/e/[slug]/page.tsx` : page SSR avec balises OG/Twitter, JSON-LD `Event`, canonique sur le sous-domaine et `noindex` pour les aperçus. Un ancien slug donne une redirection permanente (308). Un brouillon, un événement inconnu, refusé ou supprimé donne un 404.
- L'achat redirige vers le checkout Store existant : `/events/:id/buy?return_url=<page>`.

## Lancer en local

```bash
npm install
cp .env.example .env.local   # FEETI_API_URL, EVENT_PAGES_ROOT_DOMAIN, FEETI_STORE_URL
npm run dev                  # http://<slug>.localhost:3100
```

Le back doit tourner avec `EVENT_PAGES_URL_TEMPLATE=http://{slug}.localhost:3100`. Voir `FeetiTicketWeb/back/scripts/dev-event-pages.mjs`, qui utilise la base locale `feeti2_pages`.

## Déploiement (non fait : nécessite un accord)

Projet Vercel distinct, domaine joker `*.feeti.io` (DNS + certificat joker), variables `FEETI_API_URL`, `EVENT_PAGES_ROOT_DOMAIN`, `FEETI_STORE_URL`. Côté back : `EVENT_PAGES_ROOT_DOMAIN`, `EVENT_PAGES_URL_TEMPLATE=https://{slug}.feeti.io` et, de préférence, `EVENT_PAGE_PREVIEW_SECRET`.
