import type { MetadataRoute } from "next";

/** Search engines may read the landing page and the legal pages only. Everything else needs a login or is private. */
export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    rules: { userAgent: "*", allow: ["/welcome", "/privacy", "/terms"], disallow: ["/api/", "/admin", "/share/"] },
    ...(site ? { sitemap: `${site}/sitemap.xml` } : {}),
  };
}
