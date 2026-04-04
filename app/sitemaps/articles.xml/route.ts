import { contentRepository } from "@/lib/repositories/content-repository";
import { xmlResponse } from "@/lib/xml";

export async function GET() {
  const payload = await contentRepository.getSitemapPayload();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${payload.articles
  .slice(0, 50000)
  .map((loc) => `<url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
  .join("\n")}
</urlset>`;

  return xmlResponse(xml);
}
