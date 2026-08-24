import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://tripelor.com";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/stays/uhoos-lavish-oasis`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/stays/uhoos-lavish-oasis/room-101`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/stays/uhoos-lavish-oasis/room-102`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/stays/masfalhi-view-inn`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/island-adventures`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/island-adventures/reef-relax-escape`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/island-adventures/5-night-island-adventure`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/island-adventures/ocean-discovery-escape`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/tours`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/speedboat`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/travel-info`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/build-your-trip`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
