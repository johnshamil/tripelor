import type { MetadataRoute } from "next";
import { publishedProperties } from "@/lib/property-store";
import { publicStories } from "@/lib/trip-story-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://tripelor.com";
  const now = new Date();
  const [managed, stories] = await Promise.all([publishedProperties(), publicStories(50).catch(() => [])]);
  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
      alternates: {
        languages: {
          en: base,
          it: `${base}/it`,
          de: `${base}/de`,
          ru: `${base}/ru`,
          "zh-CN": `${base}/zh`,
          fr: `${base}/fr`,
          es: `${base}/es`,
        },
      },
    },
    { url: `${base}/it`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/de`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/ru`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/zh`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/fr`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/es`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/stays/nala-veli-maldives`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/stays/uhoos-lavish-oasis`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/stays/uhoos-lavish-oasis/room-101`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/stays/uhoos-lavish-oasis/room-102`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/stays/masfalhi-view-inn`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/island-adventures`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/shared-excursions`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/island-adventures/vaavu-blue-escape`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/island-adventures/reef-relax-escape`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/island-adventures/5-night-island-adventure`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/island-adventures/ocean-discovery-escape`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/tours/voyages-maldives`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/tours`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/tours/noah-safari-maldives`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/speedboat`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/travel-info`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/reviews`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/stories`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/build-your-trip`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/maldives-matchmaker`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/maldives-budget-calculator`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/free-maldives-itinerary`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/maldives-pass`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/secret-deals`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/maldives-pass`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...managed.map((property) => ({ url: `${base}/stays/${property.slug}`, lastModified: new Date(property.updated_at), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...stories.map((bundle: any) => ({ url: `${base}/story/${bundle.story.share_token}`, lastModified: new Date(bundle.story.published_at || new Date()), changeFrequency: "monthly" as const, priority: 0.65 })),
  ];
}
