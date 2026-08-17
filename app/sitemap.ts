import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://tripelor.com";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/stays/uhoos-lavish-oasis`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/stays/masfalhi-view-inn`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/island-adventures`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/island-adventures/reef-relax-escape`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/island-adventures/5-night-island-adventure`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/island-adventures/ocean-discovery-escape`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/booking`, changeFrequency: "monthly", priority: 0.7 },
  ];
}
