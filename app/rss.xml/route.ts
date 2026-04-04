import { contentRepository } from "@/lib/repositories/content-repository";
import { absoluteUrl } from "@/lib/utils";
import { xmlResponse } from "@/lib/xml";

export async function GET() {
  const latest = (await contentRepository.getLatestArticles(1)).items.slice(0, 40);
  const now = new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>معلومة</title>
    <link>${absoluteUrl("/")}</link>
    <description>آخر المقالات في معلومة</description>
    <language>ar</language>
    <lastBuildDate>${now}</lastBuildDate>
    ${latest
      .map(
        (article) => `<item>
      <title><![CDATA[${article.title}]]></title>
      <link>${absoluteUrl(`/articles/${article.slug}`)}</link>
      <guid>${absoluteUrl(`/articles/${article.slug}`)}</guid>
      <pubDate>${new Date(article.publishedAt).toUTCString()}</pubDate>
      <description><![CDATA[${article.excerpt}]]></description>
    </item>`,
      )
      .join("\n")}
  </channel>
</rss>`;

  return xmlResponse(xml);
}

