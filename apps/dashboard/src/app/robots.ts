import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/api/", "/en/"] },
    ],
    sitemap: "https://vendcfo.vercel.app/sitemap.xml",
  };
}
