import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/utils";
import {
  loadReferenceArticleSeeds,
  loadReferenceTaxonomy,
  MAIN_CATEGORY_NAMES,
} from "@/lib/reference-loader";
import type {
  ArticleCardModel,
  ArticleModel,
  AuthorSummary,
  MainCategory,
  StaticPageModel,
} from "@/lib/types";

const AUTHORS: AuthorSummary[] = [
  {
    id: "author-1",
    slug: "فريق-التحرير",
    name: "فريق التحرير",
    bio: "فريق متخصص في إنتاج محتوى عربي موثوق ومنظم وفق معايير تحرير وتدقيق واضحة.",
  },
  {
    id: "author-2",
    slug: "نورا-العلي",
    name: "نورا العلي",
    bio: "كاتبة محتوى معرفي تركز على تبسيط الموضوعات المعقدة للقارئ العربي.",
  },
  {
    id: "author-3",
    slug: "سالم-الحربي",
    name: "سالم الحربي",
    bio: "محرر متخصص في التقنية والاقتصاد الرقمي.",
  },
];

const REVIEWERS: AuthorSummary[] = [
  {
    id: "reviewer-1",
    slug: "لجنة-التدقيق",
    name: "لجنة التدقيق",
    bio: "مراجعة جودة المحتوى والتحقق من الاتساق والمنهجية.",
  },
];

const STATIC_PAGES: StaticPageModel[] = [
  {
    slug: "about",
    title: "عن المنصة",
    description: "تعرف على رسالتنا في بناء منصة معرفة عربية موثوقة وسريعة.",
    body: "نحن منصة محتوى عربية متخصصة في تنظيم المعرفة وتقديم مقالات موثوقة وسهلة التصفح. نعتمد على معايير تحرير وتدقيق واضحة، ونبني تجربة قراءة سريعة ومناسبة للهاتف أولًا.",
  },
  {
    slug: "editorial-standards",
    title: "معايير التدقيق",
    description: "المنهج التحريري والتدقيقي الذي نطبقه قبل النشر وبعده.",
    body: "نستخدم دورة تحرير متعددة المراحل: كتابة أولية، مراجعة أسلوب، تدقيق حقائق، تحسين لغوي، ثم مراجعة نهائية للنشر. يتم توثيق المصادر ومراجعة التحديثات دوريًا.",
  },
  {
    slug: "contact",
    title: "اتصل بنا",
    description: "قنوات التواصل مع فريق التحرير والدعم.",
    body: "للاقتراحات والتصحيحات واستفسارات الشراكات، يمكن التواصل عبر البريد: contact@example.com. نراجع الرسائل خلال أيام العمل.",
  },
  {
    slug: "privacy",
    title: "سياسة الخصوصية",
    description: "كيف نجمع البيانات ونحميها ونستخدمها.",
    body: "نلتزم بحماية خصوصية المستخدمين وتقليل جمع البيانات إلى الحد الأدنى اللازم لتحسين الخدمة وتجربة الاستخدام.",
  },
  {
    slug: "terms",
    title: "اتفاقية الاستخدام",
    description: "الشروط المنظمة لاستخدام المنصة والمحتوى.",
    body: "باستخدام المنصة، يوافق المستخدم على شروط الاستخدام وسياسات النشر وإعادة الاستخدام بما يتوافق مع القوانين المعمول بها.",
  },
  {
    slug: "about-us",
    title: "About Us",
    description: "English overview for partners and international visitors.",
    body: "We are an Arabic-first knowledge platform focused on editorial quality, clean information architecture, and scalable SEO infrastructure.",
  },
  {
    slug: "team",
    title: "فريق التحرير",
    description: "تعرف على الكتّاب والمدققين المشرفين على المحتوى.",
    body: "يتكون فريقنا من كتّاب متخصصين ومدققين يعملون معًا لضمان الوضوح والدقة وحداثة المحتوى.",
  },
];

const ARTICLE_IMAGE = "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80";

const PAGE_SIZE = 24;

function paginate<T>(items: T[], page: number, pageSize = PAGE_SIZE) {
  const safePage = Math.max(1, page);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    pageSize,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    items: items.slice(start, start + pageSize),
  };
}

const buildMemoryDataset = cache(async () => {
  const taxonomy = await loadReferenceTaxonomy();
  const articleSeeds = await loadReferenceArticleSeeds();

  const mainCategorySet = new Set<string>(MAIN_CATEGORY_NAMES);

  const mainCategoryMap = new Map<string, MainCategory>();
  for (const main of MAIN_CATEGORY_NAMES) {
    mainCategoryMap.set(main, {
      id: `main-${main}`,
      name: main,
      slug: main.replace(/\s+/g, "-").toLowerCase(),
      description: `دليل شامل ضمن قسم ${main} يضم مقالات حديثة ومصنفة بعناية.`,
      subcategories: [],
    });
  }

  for (const row of taxonomy) {
    const parent = mainCategoryMap.get(row.parentName);
    if (!parent) continue;
    if (!mainCategorySet.has(row.name)) {
      parent.subcategories.push({
        id: `sub-${row.slug}`,
        name: row.name,
        slug: row.slug,
        parentSlug: parent.slug,
      });
    }
  }

  for (const [, cat] of mainCategoryMap) {
    cat.subcategories = cat.subcategories
      .sort((a, b) => a.name.localeCompare(b.name, "ar"))
      .slice(0, 80);
  }

  const allSubcategories = [...mainCategoryMap.values()].flatMap((c) => c.subcategories);

  const articles: ArticleCardModel[] = articleSeeds.map((seed, index) => {
    const sub = allSubcategories.find((item) => item.slug === seed.subcategorySlug) ?? allSubcategories[index % allSubcategories.length];
    const main = [...mainCategoryMap.values()].find((c) => c.slug === sub.parentSlug) ?? [...mainCategoryMap.values()][0];
    const author = AUTHORS[index % AUTHORS.length];
    const published = new Date(Date.now() - index * 8.64e7);

    return {
      id: `article-${seed.slug}`,
      title: seed.title,
      slug: seed.slug,
      excerpt: `دليل عملي ومبسّط حول ${seed.title} مع نقاط واضحة وروابط داخلية مفيدة للقارئ.`,
      categoryName: main.name,
      categorySlug: main.slug,
      subcategoryName: sub.name,
      subcategorySlug: sub.slug,
      publishedAt: published.toISOString(),
      readingMinutes: 4 + (index % 7),
      heroImage: ARTICLE_IMAGE,
      author,
    };
  });

  const latest = [...articles]
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 30);
  const popular = [...articles].slice(15, 45);
  const trending = [...articles].slice(0, 8);

  return {
    mainCategories: [...mainCategoryMap.values()],
    articles,
    latest,
    popular,
    trending,
  };
});

function toArticleModel(base: ArticleCardModel, relatedPool: ArticleCardModel[]): ArticleModel {
  const relatedArticles = relatedPool.filter((item) => item.slug !== base.slug).slice(0, 6);

  return {
    ...base,
    updatedAt: new Date(new Date(base.publishedAt).getTime() + 1000 * 60 * 60 * 24 * 3).toISOString(),
    reviewer: REVIEWERS[0],
    canonical: absoluteUrl(`/articles/${base.slug}`),
    keywords: [base.categoryName, base.subcategoryName, base.title],
    trustNote: "تمت مراجعة هذا المحتوى من فريق التحرير وفق سياسة التدقيق الداخلية.",
    sections: [
      {
        id: `${base.id}-s1`,
        blockType: "paragraph",
        heading: "مقدمة",
        content: `يشرح هذا المقال موضوع ${base.title} بطريقة عملية ومركزة، مع ترتيب منطقي للنقاط التي يحتاجها القارئ العربي.`,
      },
      {
        id: `${base.id}-s2`,
        blockType: "heading",
        heading: `أهم النقاط حول ${base.title}`,
        content: "",
      },
      {
        id: `${base.id}-s3`,
        blockType: "list",
        content: "- تعريف مختصر وواضح\n- خطوات تطبيقية\n- أخطاء شائعة يجب تجنبها\n- روابط مقالات مكملة",
      },
      {
        id: `${base.id}-s4`,
        blockType: "note",
        heading: "ملاحظة تحريرية",
        content: "يتم تحديث هذا المحتوى دوريًا عند توفر معلومات أحدث أو أوضح.",
      },
      {
        id: `${base.id}-s5`,
        blockType: "table",
        heading: "ملخص سريع",
        content: "",
        payload: {
          headers: ["العنصر", "التوضيح"],
          rows: [
            ["القسم", base.categoryName],
            ["التصنيف الفرعي", base.subcategoryName],
            ["مدة القراءة", `${base.readingMinutes} دقائق`],
          ],
        },
      },
    ],
    faqs: [
      {
        question: `ما الهدف من مقال ${base.title}؟`,
        answer: "تقديم شرح مبسط ومنظم يساعد القارئ على الفهم السريع واتخاذ خطوات عملية.",
      },
      {
        question: "هل يتم تحديث المقالات؟",
        answer: "نعم، تتم مراجعة المقالات وتحديثها بشكل دوري عند الحاجة.",
      },
    ],
    sources: [
      {
        title: "مرجع معرفي داخلي",
        url: absoluteUrl(`/categories/${base.categorySlug}/${base.subcategorySlug}`),
        publisher: "معلومة",
      },
    ],
    relatedArticles,
  };
}

export const contentRepository = {
  getHomeData: cache(async () => {
    const memory = await buildMemoryDataset();
    return {
      trending: memory.trending,
      popular: memory.popular,
      latest: memory.latest,
      categories: memory.mainCategories,
    };
  }),

  getMainCategories: cache(async () => {
    const memory = await buildMemoryDataset();
    return memory.mainCategories;
  }),

  getCategoryBySlug: cache(async (categorySlug: string) => {
    const memory = await buildMemoryDataset();
    return memory.mainCategories.find((item) => item.slug === categorySlug) ?? null;
  }),

  getSubcategoryBySlug: cache(async (categorySlug: string, subcategorySlug: string) => {
    const category = await contentRepository.getCategoryBySlug(categorySlug);
    return category?.subcategories.find((item) => item.slug === subcategorySlug) ?? null;
  }),

  getArticlesByCategory: cache(async (categorySlug: string, page = 1) => {
    const memory = await buildMemoryDataset();
    const filtered = memory.articles.filter((item) => item.categorySlug === categorySlug);
    return paginate(filtered, page);
  }),

  getArticlesBySubcategory: cache(async (subcategorySlug: string, page = 1) => {
    const memory = await buildMemoryDataset();
    const filtered = memory.articles.filter((item) => item.subcategorySlug === subcategorySlug);
    return paginate(filtered, page);
  }),

  getLatestArticles: cache(async (page = 1) => {
    const memory = await buildMemoryDataset();
    return paginate(
      [...memory.articles].sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt)),
      page,
    );
  }),

  getPopularArticles: cache(async (page = 1) => {
    const memory = await buildMemoryDataset();
    return paginate([...memory.popular, ...memory.articles.slice(40, 110)], page);
  }),

  searchArticles: cache(async (query: string, page = 1) => {
    const q = query.trim().toLowerCase();
    const memory = await buildMemoryDataset();
    if (!q) return paginate(memory.articles.slice(0, 120), page);

    const filtered = memory.articles.filter((item) => {
      const haystack = `${item.title} ${item.excerpt} ${item.categoryName} ${item.subcategoryName}`.toLowerCase();
      return haystack.includes(q);
    });

    return paginate(filtered, page);
  }),

  getArticleBySlug: cache(async (slug: string): Promise<ArticleModel | null> => {
    const memory = await buildMemoryDataset();
    const article = memory.articles.find((item) => item.slug === slug);
    if (!article) return null;
    return toArticleModel(article, memory.articles);
  }),

  getAuthors: cache(async () => AUTHORS),

  getAuthorBySlug: cache(async (slug: string) => AUTHORS.find((item) => item.slug === slug) ?? null),

  getArticlesByAuthor: cache(async (authorSlug: string, page = 1) => {
    const memory = await buildMemoryDataset();
    const filtered = memory.articles.filter((item) => item.author.slug === authorSlug);
    return paginate(filtered, page);
  }),

  getStaticPage: cache(async (slug: string) => STATIC_PAGES.find((page) => page.slug === slug) ?? null),

  getSitemapPayload: cache(async () => {
    const memory = await buildMemoryDataset();
    const categories = memory.mainCategories.flatMap((main) => [
      absoluteUrl(`/categories/${main.slug}`),
      ...main.subcategories.map((sub) => absoluteUrl(`/categories/${main.slug}/${sub.slug}`)),
    ]);

    const articles = memory.articles.map((article) => absoluteUrl(`/articles/${article.slug}`));

    return {
      categories,
      articles,
      images: memory.articles.map((article) => article.heroImage),
    };
  }),

  getDbHealth: cache(async () => {
    if (!process.env.DATABASE_URL) {
      return { connected: false };
    }
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { connected: true };
    } catch {
      return { connected: false };
    }
  }),
};

