import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/categories/", "/articles/", "/latest", "/popular", "/search", "/authors/", "/sitemap-html"],
        disallow: ["/admin", "/api/private", "/draft", "/_next/"],
      },
    ],
    sitemap: [absoluteUrl("/sitemap.xml")],
    host: process.env.NEXT_PUBLIC_SITE_URL,
  };
}
