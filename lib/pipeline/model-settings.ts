import { prisma } from "@/lib/prisma";

const GENERAL_SETTINGS_SLUG = "model-settings-general";
const ARTICLE_SETTINGS_SLUG = "model-settings-articles";

export const DEFAULT_GENERAL_SETTINGS = `أنت نظام إنتاج محتوى عربي احترافي.

قواعد تشغيل إلزامية:
- إنشاء المحتوى بنمط Cluster.
- كل Cluster مغلق على نفسه (Topic Isolation).
- يمنع خلط مواضيع من مجالات مختلفة.
- يمنع الربط الداخلي خارج نفس التصنيف أو نفس المحور.
- إذا لم توجد روابط مناسبة: لا تضف روابط عشوائية.
- الجودة أهم من العدد.
- الأسلوب يجب أن يكون مباشرًا وواضحًا ويخدم المستخدم.

سياسات SEO:
- لا Thin Content.
- لا تكرار.
- عنوان واضح + نية بحث واضحة.
- بنية منطقية بعناوين H2/H3.
- خاتمة عملية.`;

export const DEFAULT_ARTICLE_SETTINGS = `نظام الكتابة (3 مراحل داخلية):
1) Analysis:
- تحديد Primary Keyword.
- تحديد Search Intent.
- تحديد سؤال المستخدم الأساسي.
- اختيار زاوية واحدة فقط: شرح مبسط / تحليل / أسباب / نتائج / دروس.

2) Outline:
- H2/H3 تخدم النية مباشرة.
- ترتيب منطقي بدون حشو.

3) Execution:
- 900-1500 كلمة.
- أسلوب بشري احترافي، غير موسوعي.
- أمثلة واقعية + خطوات + نصائح + FAQ.
- فقرات قصيرة وواضحة.
- لا تكرار ولا لغة AI نمطية.

SEO لكل مقال:
- Meta Title
- Meta Description
- Slug نظيف
- كلمات LSI

الربط الداخلي:
- 2-5 روابط فقط إذا كانت من نفس المحور/التصنيف.
- إذا لا يوجد تطابق: اترك القسم فارغًا أو أضف اقتراحات مستقبلية فقط.`;

export type ModelSettings = {
  general: string;
  article: string;
};

async function readSettingBody(slug: string, fallback: string) {
  if (!process.env.DATABASE_URL) return fallback;
  try {
    const row = await prisma.staticPage.findUnique({
      where: { slug },
      select: { body: true },
    });
    return row?.body?.trim() ? row.body : fallback;
  } catch {
    return fallback;
  }
}

export async function getModelSettings(): Promise<ModelSettings> {
  const [general, article] = await Promise.all([
    readSettingBody(GENERAL_SETTINGS_SLUG, DEFAULT_GENERAL_SETTINGS),
    readSettingBody(ARTICLE_SETTINGS_SLUG, DEFAULT_ARTICLE_SETTINGS),
  ]);
  return { general, article };
}

export async function saveModelSettings(input: ModelSettings) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  await prisma.staticPage.upsert({
    where: { slug: GENERAL_SETTINGS_SLUG },
    create: {
      slug: GENERAL_SETTINGS_SLUG,
      title: "إعدادات الموديل - عامة",
      body: input.general,
      isIndexed: false,
    },
    update: {
      title: "إعدادات الموديل - عامة",
      body: input.general,
      isIndexed: false,
    },
  });

  await prisma.staticPage.upsert({
    where: { slug: ARTICLE_SETTINGS_SLUG },
    create: {
      slug: ARTICLE_SETTINGS_SLUG,
      title: "إعدادات الموديل - المقالات",
      body: input.article,
      isIndexed: false,
    },
    update: {
      title: "إعدادات الموديل - المقالات",
      body: input.article,
      isIndexed: false,
    },
  });
}

