import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { fetchEventPage, type EventPageData, type SalesStatus } from "@/lib/api";
import { formatEventDate, formatEventTime, formatPrice, mapsUrl } from "@/lib/format";
import { ShareButton } from "@/components/ShareButton";
import { BrandHeader, BrandFooter } from "@/components/BrandHeader";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

const STORE_URL = (process.env.FEETI_STORE_URL || "https://feeti.io").replace(/\/$/, "");

// Une seule requête API par rendu (metadata + page)
const load = cache((slug: string, preview?: string) => fetchEventPage(slug, preview));

async function resolve(props: Props): Promise<EventPageData> {
  const { slug } = await props.params;
  const { preview } = await props.searchParams;
  const result = await load(slug, typeof preview === "string" ? preview : undefined);
  if (result.kind === "redirect") {
    // Ancien slug : redirection permanente (308) vers le nouveau sous-domaine
    const target = await load(result.slug);
    if (target.kind === "page") permanentRedirect(target.data.links.page);
    notFound();
  }
  // Brouillon, inconnu, supprimé, refusé : aucune information sur l'existence de la page
  if (result.kind !== "page") notFound();
  return result.data;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const p = await resolve(props);
  const images = p.seo.ogImage ? [{ url: p.seo.ogImage, alt: p.event.title }] : undefined;
  return {
    title: p.seo.title,
    description: p.seo.description,
    alternates: { canonical: p.seo.canonical },
    robots: p.seo.noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      url: p.seo.canonical,
      siteName: "Fééti",
      title: p.seo.title,
      description: p.seo.description,
      locale: "fr_FR",
      images,
    },
    twitter: { card: images ? "summary_large_image" : "summary", title: p.seo.title, description: p.seo.description, images: p.seo.ogImage ? [p.seo.ogImage] : undefined },
  };
}

const STATUS_LABEL: Record<SalesStatus, string> = {
  open: "À venir",
  preview: "Aperçu",
  paused: "Ventes suspendues",
  blocked: "Ventes suspendues",
  soldout: "Complet",
  ended: "Terminé",
};

const CTA_DISABLED_LABEL: Partial<Record<SalesStatus, string>> = {
  paused: "Ventes suspendues",
  blocked: "Ventes suspendues",
  soldout: "Complet",
  ended: "Événement terminé",
  preview: "Achat désactivé en aperçu",
};

function jsonLd(p: EventPageData) {
  const availability =
    p.salesStatus === "soldout" ? "https://schema.org/SoldOut" : p.salesStatus === "open" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
  const online = p.event.eventType === "STREAMING_LIVE";
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: p.event.title,
    description: p.seo.description,
    startDate: p.event.startsAt ?? p.event.date,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : p.event.eventType === "MIXTE"
        ? "https://schema.org/MixedEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    location: online
      ? { "@type": "VirtualLocation", url: p.links.page }
      : { "@type": "Place", name: p.event.venue.name, address: [p.event.venue.name, p.event.venue.country].filter(Boolean).join(", ") },
    image: p.media.hero ? [p.media.hero] : undefined,
    organizer: { "@type": "Organization", name: p.organizer.name },
    offers: p.tickets.map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: t.price,
      priceCurrency: p.event.currency === "FCFA" ? "XAF" : p.event.currency,
      availability,
      url: p.links.page,
    })),
  };
}

export default async function EventPage(props: Props) {
  const p = await resolve(props);
  const canBuy = p.salesStatus === "open";
  const dateLabel = formatEventDate(p.event.date);
  const timeLabel = formatEventTime(p.event.time);
  const shareText = `Je serai à ${p.event.title} le ${dateLabel.toLowerCase()}. Prends ta place ici :`;
  const priceFrom = p.priceFrom != null ? formatPrice(p.priceFrom, p.event.currency) : null;
  const ctaLabel = canBuy ? p.cta.label : CTA_DISABLED_LABEL[p.salesStatus] ?? p.cta.label;
  const accentStyle = { "--accent": p.theme.accent } as React.CSSProperties;

  return (
    <div className="page" style={accentStyle}>
      {/* JSON-LD : données structurées Event (contenu sérialisé, pas de HTML utilisateur) */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(p)).replace(/</g, "\\u003c") }} />

      {p.salesStatus === "preview" && (
        <div className="preview-banner" role="status">Aperçu privé : cette page n&apos;est pas encore publiée.</div>
      )}

      <BrandHeader>
        <ShareButton className="btn-ghost" url={p.links.page} title={p.event.title} text={shareText} />
      </BrandHeader>

      <main>
        <section className="cover">
          {p.media.hero ? (
            // Visuel prioritaire (LCP) : pas de lazy-loading
            <img className="cover-img" src={p.media.hero} alt={`Visuel de l'événement ${p.event.title}`} fetchPriority="high" />
          ) : (
            <div className="cover-img cover-empty" aria-hidden="true" />
          )}
          <div className="cover-body">
            <span className={`tag tag-${p.salesStatus}`}>{STATUS_LABEL[p.salesStatus]}</span>
            <h1>{p.event.title}</h1>
            <ul className="facts">
              <li>
                <span className="fact-label">Date</span>
                <span>{dateLabel}, {timeLabel}</span>
              </li>
              <li>
                <span className="fact-label">Lieu</span>
                <a href={mapsUrl(p.event.venue.name)} target="_blank" rel="noopener noreferrer">
                  {p.event.venue.name}
                </a>
              </li>
              {priceFrom && (
                <li>
                  <span className="fact-label">Prix</span>
                  <span>{p.tickets.length > 1 ? `À partir de ${priceFrom}` : priceFrom}</span>
                </li>
              )}
            </ul>
          </div>
        </section>

        <section className="card organizer" aria-label="Organisateur">
          {p.organizer.avatar ? (
            <img className="avatar" src={p.organizer.avatar} alt="" loading="lazy" />
          ) : (
            <span className="avatar avatar-initial" aria-hidden="true">{p.organizer.name.charAt(0).toUpperCase()}</span>
          )}
          <div>
            <p className="muted small">Organisé par</p>
            <p className="strong">{p.organizer.name}</p>
          </div>
        </section>

        <section className="card" aria-labelledby="tickets-title">
          <h2 id="tickets-title">Billets</h2>
          <ul className="tickets">
            {p.tickets.map((t) => (
              <li key={t.id}>
                <span>{t.name}</span>
                <span className="strong">{formatPrice(t.price, p.event.currency)}</span>
              </li>
            ))}
          </ul>
          {canBuy && p.availability.lowStock && (
            <p className="stock">Plus que {p.availability.remaining} place{p.availability.remaining > 1 ? "s" : ""}</p>
          )}
          {(p.salesStatus === "paused" || p.salesStatus === "blocked") && (
            <p className="notice">L&apos;organisateur a suspendu les ventes pour le moment.</p>
          )}
          {p.salesStatus === "ended" && (
            <p className="notice">
              Cet événement est terminé.
              {p.links.replay && (
                <>
                  {" "}
                  <a href={p.links.replay}>Voir le replay sur Fééti Play</a>
                </>
              )}
            </p>
          )}
        </section>

        <section className="card" aria-labelledby="about-title">
          <h2 id="about-title">À propos</h2>
          <p className="description">{p.event.description}</p>
        </section>

        <section className="card" aria-labelledby="venue-title">
          <h2 id="venue-title">Lieu</h2>
          <p>{p.event.venue.name}</p>
          {p.event.venue.country && <p className="muted">{p.event.venue.country}</p>}
          <a className="btn-outline" href={mapsUrl(p.event.venue.name)} target="_blank" rel="noopener noreferrer">
            Itinéraire
          </a>
        </section>

        <section className="discover">
          <p>Découvrez d&apos;autres événements près de chez vous.</p>
          <a className="btn-outline" href={`${STORE_URL}/events`}>
            Voir les événements sur Fééti
          </a>
        </section>
      </main>

      <BrandFooter />

      <div className="buybar">
        <div>
          {priceFrom && <p className="small muted">{p.tickets.length > 1 ? "À partir de" : "Prix"}</p>}
          {priceFrom && <p className="strong">{priceFrom}</p>}
        </div>
        {canBuy ? (
          <a className="btn-primary" href={p.links.buy}>
            {ctaLabel}
          </a>
        ) : (
          <button className="btn-primary" type="button" disabled aria-disabled="true">
            {ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}
