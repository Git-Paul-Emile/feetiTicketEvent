import "server-only";

/** Contrat de GET /api/public/events/by-slug/:slug (feeti2-back). */
export type SalesStatus = "open" | "paused" | "blocked" | "soldout" | "ended" | "preview";

export type EventPageData = {
  slug: string;
  status: "draft" | "published" | "paused" | "archived";
  salesStatus: SalesStatus;
  event: {
    id: string;
    title: string;
    description: string;
    category: string;
    eventType: "PRESENTIEL" | "STREAMING_LIVE" | "MIXTE";
    startsAt: string | null;
    date: string;
    time: string;
    duration: string | null;
    venue: { name: string; country: string | null; countryCode: string | null };
    currency: string;
    isLive: boolean;
  };
  organizer: { name: string; avatar: string | null };
  tickets: { id: string; name: string; price: number }[];
  availability: { remaining: number; lowStock: boolean };
  priceFrom: number | null;
  media: { hero: string | null; gallery: string[] };
  theme: { accent: string; sections: string[] };
  cta: { label: string };
  seo: { title: string; description: string; ogImage: string | null; canonical: string; noindex: boolean };
  links: { page: string; main: string; buy: string; replay: string | null };
  updatedAt: string;
};

export type PageResult =
  | { kind: "page"; data: EventPageData }
  | { kind: "redirect"; slug: string }
  | { kind: "gone" }
  | { kind: "not-found" };

const API_URL = (process.env.FEETI_API_URL || "http://localhost:8010").replace(/\/$/, "");
export const REVALIDATE_SECONDS = 60;

/**
 * Lecture d'une page. Les pages publiques passent par le cache de données
 * (ISR 60 s, tag par slug pour une invalidation à la demande) ; un aperçu privé jamais.
 */
export async function fetchEventPage(slug: string, previewToken?: string): Promise<PageResult> {
  const url = new URL(`${API_URL}/api/public/events/by-slug/${encodeURIComponent(slug)}`);
  if (previewToken) url.searchParams.set("preview", previewToken);

  const res = await fetch(
    url,
    previewToken
      ? { cache: "no-store" }
      : { next: { revalidate: REVALIDATE_SECONDS, tags: [`event-page:${slug}`] } },
  );

  if (res.status === 404) return { kind: "not-found" };
  if (res.status === 410) return { kind: "gone" };
  if (!res.ok) throw new Error(`API pages événement : HTTP ${res.status}`);

  const body = (await res.json()) as { data: EventPageData | { redirect: { slug: string } } };
  if ("redirect" in body.data) return { kind: "redirect", slug: body.data.redirect.slug };
  return { kind: "page", data: body.data };
}
