import { PrismaClient } from "@prisma/client";
import { readFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

function slugifyArabic(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

async function loadLines(fileName: string) {
  const fullPath = path.join(process.cwd(), "reference-data", fileName);
  const content = await readFile(fullPath, "utf8");
  return content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

async function main() {
  await prisma.articleRelated.deleteMany();
  await prisma.articleSource.deleteMany();
  await prisma.articleFaq.deleteMany();
  await prisma.articleSection.deleteMany();
  await prisma.trendingSlot.deleteMany();
  await prisma.popularArticle.deleteMany();
  await prisma.article.deleteMany();
  await prisma.category.deleteMany();
  await prisma.author.deleteMany();
  await prisma.reviewer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.staticPage.deleteMany();

  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      passwordHash: "change-me",
      fullName: "System Admin",
      role: "ADMIN",
    },
  });

  const authorUser = await prisma.user.create({
    data: {
      email: "author@example.com",
      passwordHash: "change-me",
      fullName: "فريق التحرير",
      role: "AUTHOR",
    },
  });

  const reviewerUser = await prisma.user.create({
    data: {
      email: "reviewer@example.com",
      passwordHash: "change-me",
      fullName: "لجنة التدقيق",
      role: "REVIEWER",
    },
  });

  const author = await prisma.author.create({
    data: {
      userId: authorUser.id,
      slug: "فريق-التحرير",
      displayName: "فريق التحرير",
      bio: "فريق متخصص في إعداد محتوى عربي موثوق.",
    },
  });

  const reviewer = await prisma.reviewer.create({
    data: {
      userId: reviewerUser.id,
      slug: "لجنة-التدقيق",
      displayName: "لجنة التدقيق",
      bio: "مراجعة علمية ولغوية قبل وبعد النشر.",
    },
  });

  const mainNames = [
    "فن الطهي",
    "حول العالم",
    "العناية بالذات",
    "مال وأعمال",
    "سؤال وجواب",
    "تقنية",
    "علوم الأرض",
    "فنون",
    "قصص وحكايات",
    "تغذية",
    "إسلام",
    "الزواج والحب",
    "حيوانات ونباتات",
    "تعليم",
    "صحة",
    "الحياة والمجتمع",
    "رياضة",
    "الأسرة",
    "وزن ورشاقة",
    "منوعات",
  ];

  const mainCategoryRecords = new Map<string, { id: string; slug: string }>();
  for (const name of mainNames) {
    const created = await prisma.category.create({
      data: {
        name,
        slug: slugifyArabic(name),
        level: 1,
        description: `قسم ${name}`,
      },
    });
    mainCategoryRecords.set(name, { id: created.id, slug: created.slug });
  }

  const categoryLines = await loadLines("mawdoo3_categories.txt");
  let subcategoryCount = 0;

  for (const line of categoryLines) {
    const url = new URL(line);
    const decoded = decodeURIComponent(url.pathname).replace(/^\//, "");
    if (!decoded.startsWith("تصنيف:")) continue;

    const name = decoded.replace("تصنيف:", "").replaceAll("_", " ").trim();
    if (mainNames.includes(name)) continue;

    const mainName = mainNames[subcategoryCount % mainNames.length];
    const parent = mainCategoryRecords.get(mainName)!;

    await prisma.category.upsert({
      where: { slug: slugifyArabic(name) },
      create: {
        name,
        slug: slugifyArabic(name),
        level: 2,
        parentId: parent.id,
        description: `تصنيف فرعي ضمن ${mainName}`,
      },
      update: {
        name,
      },
    });

    subcategoryCount += 1;
    if (subcategoryCount >= 462) break;
  }

  const subcategories = await prisma.category.findMany({ where: { level: 2 }, take: 500 });
  const articleLines = await loadLines("mawdoo3_topic_links_from_categories.txt");

  const createdArticles: { id: string; slug: string }[] = [];

  for (const [index, line] of articleLines.entries()) {
    if (index >= 600) break;
    const url = new URL(line);
    const decoded = decodeURIComponent(url.pathname).replace(/^\//, "");
    if (!decoded || decoded.startsWith("تصنيف:") || decoded.startsWith("خاص:")) continue;

    const title = decoded.replaceAll("_", " ").trim();
    const slug = slugifyArabic(title);
    const category = subcategories[index % subcategories.length];

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        excerpt: `ملخص أصلي حول ${title} مكتوب لأغراض التشغيل الأولي للقوالب.`,
        status: "PUBLISHED",
        publishedAt: new Date(Date.now() - index * 3600_000),
        readingMinutes: 4 + (index % 6),
        authorId: author.id,
        reviewerId: reviewer.id,
        categoryId: category.id,
        keywords: [category.name, title],
      },
    });

    await prisma.articleSection.create({
      data: {
        articleId: article.id,
        orderNo: 1,
        blockType: "paragraph",
        heading: "مقدمة",
        content: `هذا محتوى تمهيدي عن ${title} للاستخدام الأولي في بيئة التطوير.`,
      },
    });

    await prisma.articleFaq.create({
      data: {
        articleId: article.id,
        orderNo: 1,
        question: `ما هو ${title}؟`,
        answer: `شرح موجز حول ${title}.`,
      },
    });

    await prisma.articleSource.create({
      data: {
        articleId: article.id,
        orderNo: 1,
        title: "مرجع داخلي",
        url: `https://example.com/${slug}`,
        publisher: "معلومة",
      },
    });

    createdArticles.push({ id: article.id, slug: article.slug });
  }

  for (let i = 0; i < Math.min(10, createdArticles.length); i += 1) {
    await prisma.trendingSlot.create({
      data: {
        slotKey: `hero-${i + 1}`,
        articleId: createdArticles[i].id,
      },
    });
  }

  for (let i = 0; i < Math.min(30, createdArticles.length); i += 1) {
    await prisma.popularArticle.create({
      data: {
        articleId: createdArticles[i].id,
        rankPosition: i + 1,
        windowDays: 7,
      },
    });
  }

  const staticPages = [
    ["about", "عن المنصة", "محتوى تعريفي بالمنصة"],
    ["editorial-standards", "معايير التدقيق", "شرح سياسة التحرير والتدقيق"],
    ["contact", "اتصل بنا", "قنوات التواصل الرسمية"],
    ["privacy", "سياسة الخصوصية", "تفاصيل جمع البيانات وحمايتها"],
    ["terms", "اتفاقية الاستخدام", "شروط الاستخدام"],
    ["team", "فريق التحرير", "تعريف فريق التحرير"],
  ] as const;

  for (const [slug, title, body] of staticPages) {
    await prisma.staticPage.create({ data: { slug, title, body } });
  }

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: "SEED_COMPLETED",
      entityType: "system",
      payload: { subcategoryCount, articleCount: createdArticles.length },
    },
  });

  console.log(`Seed done: ${subcategoryCount} subcategories, ${createdArticles.length} articles`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

