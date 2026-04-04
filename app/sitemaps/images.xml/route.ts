import { contentRepository } from "@/lib/repositories/content-repository";
import { absoluteUrl } from "@/lib/utils";
import { xmlResponse } from "@/lib/xml";

export async function GET() {
  const payload = await contentRepository.getSitemapPayload();
  const articlePayload = (await contentRepository.getLatestArticles(1)).items;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${articlePayload
  .map(
    (article, index) => `<url><loc>${absoluteUrl(`/articles/${article.slug}`)}</loc><image:image><image:loc>${
      payload.images[index % payload.images.length]
    }</image:loc><image:title>${article.title}</image:title></image:image></url>`,
  )
  .join("\n")}
</urlset>`;

  return xmlResponse(xml);
}
