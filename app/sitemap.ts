import type { MetadataRoute } from "next";

const BASE_URL = "https://draftedge.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/rankings`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/trade`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/cheatsheet`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/mock`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/start-sit`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/privacy`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${BASE_URL}/cookies`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
