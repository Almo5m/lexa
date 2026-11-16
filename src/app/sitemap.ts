import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (!site) return [];
  return ["/welcome", "/privacy", "/terms"].map((path) => ({ url: `${site}${path}` }));
}
