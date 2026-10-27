import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  if (process.env.TRIPELOR_MOCK_PREVIEW === "1") return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: "https://tripelor.com/sitemap.xml",
    host: "https://tripelor.com",
  };
}
