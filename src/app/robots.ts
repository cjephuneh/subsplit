import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.APP_BASE_URL ?? "http://subsplit.co").replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard", "/admin", "/auth", "/sandbox"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}

