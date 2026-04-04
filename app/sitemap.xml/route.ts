import { absoluteUrl } from "@/lib/utils";
import { xmlResponse } from "@/lib/xml";

export async function GET() {
  const now = new Date().toISOString();
  const sitemaps = [
    absoluteUrl("/sitemaps/articles.xml"),
    absoluteUrl("/sitemaps/categories.xml"),
    absoluteUrl("/sitemaps/images.xml"),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((loc) => `<sitemap><loc>${loc}</loc><lastmod>${now}</lastmod></sitemap>`).join("\n")}
</sitemapindex>`;

  return xmlResponse(xml);
}
