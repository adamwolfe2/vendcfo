import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://vendcfo.vercel.app", lastModified: new Date() },
    { url: "https://vendcfo.vercel.app/terms", lastModified: new Date() },
    { url: "https://vendcfo.vercel.app/privacy", lastModified: new Date() },
  ];
}
