import { prisma } from "@/lib/prisma";

const GENERAL_SETTINGS_SLUG = "model-settings-general";
const ARTICLE_SETTINGS_SLUG = "model-settings-articles";
const OPTIMIZATION_SETTINGS_SLUG = "model-settings-optimization";

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

export const DEFAULT_OPTIMIZATION_SETTINGS = `أنت نظام تحسين محتوى SEO احترافي مسؤول عن تطوير المقالات المنشورة ورفع ترتيبها.

الهدف:
- رفع ترتيب المقالات
- زيادة الزيارات
- تحسين مدة بقاء المستخدم
- تقوية الربط الداخلي

دورة التحسين:
- يوميًا اختر 3-5 مقالات قديمة
- الأولوية: بدون زيارات / غير محدثة / ضعيفة الربط الداخلي

مراحل التحسين:
1) تحليل المقال: نية البحث، جودة المحتوى، الفجوات، قوة العنوان، الروابط الداخلية.
2) تحسين المحتوى: تقوية الأجزاء الضعيفة، إضافة أمثلة وخطوات عملية.
3) تحسين SEO: Meta Title/Description، توزيع الكلمات، LSI.
4) تحسين الهيكل: H2/H3 وترتيب الفقرات وإزالة الحشو.
5) الربط الداخلي: إضافة روابط مرتبطة فقط وإزالة العشوائي.
6) الصورة: تحديث prompt الصورة للمقالات المهمة أو ذات الصورة الضعيفة.

قواعد:
- لا تغير موضوع المقال بالكامل.
- لا تنشئ مقالًا جديدًا بدل التحسين.
- لا تغيّر الكلمة المفتاحية الأساسية.
- لا تضف روابط غير مرتبطة.`;

export type ModelSettings = {
  general: string;
  article: string;
  optimization: string;
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
  const [general, article, optimization] = await Promise.all([
    readSettingBody(GENERAL_SETTINGS_SLUG, DEFAULT_GENERAL_SETTINGS),
    readSettingBody(ARTICLE_SETTINGS_SLUG, DEFAULT_ARTICLE_SETTINGS),
    readSettingBody(OPTIMIZATION_SETTINGS_SLUG, DEFAULT_OPTIMIZATION_SETTINGS),
  ]);

  return { general, article, optimization };
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

  await prisma.staticPage.upsert({
    where: { slug: OPTIMIZATION_SETTINGS_SLUG },
    create: {
      slug: OPTIMIZATION_SETTINGS_SLUG,
      title: "إعدادات الموديل - تحسين المحتوى",
      body: input.optimization,
      isIndexed: false,
    },
    update: {
      title: "إعدادات الموديل - تحسين المحتوى",
      body: input.optimization,
      isIndexed: false,
    },
  });
}

