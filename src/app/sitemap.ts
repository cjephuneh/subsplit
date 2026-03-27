import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.APP_BASE_URL ?? "http://subsplit.co").replace(/\/+$/, "");
  const now = new Date();

  const routes = ["/", "/docs", "/docs/api", "/docs/models", "/contact"];
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

