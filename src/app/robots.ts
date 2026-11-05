import type { MetadataRoute } from "next";

// Chaque page publiée porte son propre index/noindex (brouillons et aperçus en noindex).
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: "/e/" } };
}
