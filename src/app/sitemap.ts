import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.APP_BASE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const now = new Date();

  const routes = ["/", "/docs", "/docs/api", "/docs/models", "/contact"];
  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));
}

