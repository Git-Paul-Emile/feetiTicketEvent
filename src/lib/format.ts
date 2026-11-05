const CURRENCY_LABELS: Record<string, string> = { FCFA: "FCFA", XOF: "FCFA", XAF: "FCFA", GNF: "GNF", EUR: "€", USD: "$" };

export function formatPrice(amount: number, currency: string): string {
  if (amount === 0) return "Gratuit";
  const n = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount);
  return `${n} ${CURRENCY_LABELS[currency] ?? currency}`;
}

/** Event.date (AAAA-MM-JJ) et Event.time (HH:mm) sont saisis en heure locale : on les affiche tels quels. */
export function formatEventDate(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  const s = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatEventTime(time: string): string {
  return /^\d{1,2}:\d{2}$/.test(time) ? time.replace(":", " h ") : time;
}

export function mapsUrl(venue: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`;
}
