"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugifyArabic } from "@/lib/slug";
import { enqueueManualTopic, intakeTopicsFromReference } from "@/lib/pipeline/topic-intake";
import { processPendingImages, publishDueArticles, publishScheduledNow, runContentPipeline } from "@/lib/pipeline/engine";
import { importReferenceTaxonomyToDb } from "@/lib/pipeline/taxonomy-import";

type ActionResult = { ok: boolean; message: string };

function revalidateSeoPaths() {
  revalidatePath("/sitemap.xml");
  revalidatePath("/sitemaps/categories.xml");
  revalidatePath("/sitemaps/articles.xml");
  revalidatePath("/sitemaps/images.xml");
  revalidatePath("/sitemap-html");
}

async function withGuard(callback: () => Promise<void>): Promise<ActionResult> {
  try {
    await callback();
    return { ok: true, message: "تم الحفظ بنجاح" };
  } catch {
    return { ok: false, message: "تعذر الحفظ في قاعدة البيانات. تأكد من إعداد DATABASE_URL ثم نفّذ migrate." };
  }
}

export async function createCategoryAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "").trim();
  const parentSlug = String(formData.get("parentSlug") ?? "").trim();
  if (!name) return;

  await withGuard(async () => {
    const parent = parentSlug ? await prisma.category.findUnique({ where: { slug: parentSlug } }) : null;
    await prisma.category.create({
      data: {
        name,
        slug: slugifyArabic(name),
        description: `قسم ${name}`,
        parentId: parent?.id,
        level: parent ? 2 : 1,
      },
    });
    revalidatePath("/");
    revalidatePath("/admin/categories");
    revalidateSeoPaths();
  });
}

export async function importReferenceTaxonomyAction(): Promise<void> {
  await withGuard(async () => {
    await importReferenceTaxonomyToDb();
    revalidatePath("/admin/categories");
    revalidatePath("/admin/pipeline");
    revalidatePath("/");
    revalidateSeoPaths();
  });
}

export async function updateCategoryAction(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!slug || !name) return;

  await withGuard(async () => {
    await prisma.category.update({
      where: { slug },
      data: {
        name,
        slug: slugifyArabic(name),
      },
    });
    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidateSeoPaths();
  });
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const slug = String(formData.get("slug") ?? "").trim();
  if (!slug) return;

  await withGuard(async () => {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: { select: { id: true } },
        articles: { select: { id: true } },
      },
    });
    if (!category) return;

    // If category has dependencies, disable it instead of hard deleting.
    if (category.children.length > 0 || category.articles.length > 0) {
      await prisma.category.update({
        where: { id: category.id },
        data: { isActive: false },
      });
    } else {
      await prisma.category.delete({ where: { id: category.id } });
    }

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidateSeoPaths();
  });
}

export async function createArticleAction(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const categorySlug = String(formData.get("categorySlug") ?? "").trim();

  if (!title || !excerpt || !categorySlug) {
    return;
  }

  await withGuard(async () => {
    const [category, author] = await Promise.all([
      prisma.category.findUnique({ where: { slug: categorySlug } }),
      prisma.author.findFirst(),
    ]);

    if (!category || !author) {
      throw new Error("Missing category or author");
    }

    const article = await prisma.article.create({
      data: {
        title,
        slug: slugifyArabic(title),
        excerpt,
        status: "PUBLISHED",
        publishedAt: new Date(),
        readingMinutes: 5,
        categoryId: category.id,
        authorId: author.id,
        keywords: [category.name],
      },
    });

    await prisma.articleSection.createMany({
      data: [
        {
          articleId: article.id,
          orderNo: 1,
          blockType: "paragraph",
          heading: "مقدمة",
          content: excerpt,
        },
      ],
    });

    revalidatePath("/");
    revalidatePath("/latest");
    revalidatePath("/admin/articles");
  });
}

export async function createStaticPageAction(formData: FormData): Promise<void> {
  const slug = slugifyArabic(String(formData.get("slug") ?? "").trim());
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!slug || !title || !body) {
    return;
  }

  await withGuard(async () => {
    await prisma.staticPage.upsert({
      where: { slug },
      create: { slug, title, body },
      update: { title, body },
    });

    revalidatePath(`/`);
    revalidatePath(`/admin/static-pages`);
  });
}

export async function setTrendingAction(formData: FormData): Promise<void> {
  const articleSlug = String(formData.get("articleSlug") ?? "").trim();
  const slotKey = String(formData.get("slotKey") ?? "hero-1").trim();

  if (!articleSlug) {
    return;
  }

  await withGuard(async () => {
    const article = await prisma.article.findUnique({ where: { slug: articleSlug } });
    if (!article) throw new Error("Article not found");

    await prisma.trendingSlot.create({
      data: {
        slotKey,
        articleId: article.id,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/trending");
  });
}

export async function addTopicToQueueAction(formData: FormData): Promise<void> {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  try {
    await enqueueManualTopic(title);
    revalidatePath("/admin/pipeline");
    redirect(`/admin/pipeline?notice=${encodeURIComponent("تمت إضافة الموضوع إلى قائمة الانتظار")}`);
  } catch {
    redirect(`/admin/pipeline?error=${encodeURIComponent("تعذر إضافة الموضوع. تحقق من DATABASE_URL")}`);
  }
}

export async function importAllReferenceTopicsAction(): Promise<void> {
  try {
    await intakeTopicsFromReference();
    revalidatePath("/admin/pipeline");
    redirect(`/admin/pipeline?notice=${encodeURIComponent("تم استيراد المواضيع من reference-data")}`);
  } catch {
    redirect(`/admin/pipeline?error=${encodeURIComponent("فشل استيراد المواضيع. تحقق من اتصال قاعدة البيانات")}`);
  }
}

export async function runPipelineNowAction(): Promise<void> {
  try {
    await runContentPipeline({ intake: false, dailyLimit: 5, scheduleBatch: 5 });
    revalidatePath("/admin/pipeline");
    revalidatePath("/admin");
    redirect(`/admin/pipeline?notice=${encodeURIComponent("تم بدء تشغيل الـ Pipeline")}`);
  } catch {
    redirect(`/admin/pipeline?error=${encodeURIComponent("تعذر تشغيل الـ Pipeline. راجع السجلات")}`);
  }
}

export async function startManualPublishingSystemAction(): Promise<void> {
  try {
    // Manual run outside cron. This does not alter cron schedules.
    await runContentPipeline({ intake: false, dailyLimit: 5, scheduleBatch: 5 });
    revalidatePath("/admin/pipeline");
    revalidatePath("/admin");
    redirect(`/admin/pipeline?notice=${encodeURIComponent("بدأ نظام النشر الآن (Cluster: 5 مقالات)")}`);
  } catch {
    redirect(`/admin/pipeline?error=${encodeURIComponent("فشل بدء نظام النشر. تحقق من السجلات والبيئة")}`);
  }
}

export async function publishDueNowAction(): Promise<void> {
  try {
    const due = await publishDueArticles(5);
    const forced = due.published === 0 ? await publishScheduledNow(5) : { published: 0 };
    const total = due.published + forced.published;

    revalidatePath("/admin/pipeline");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/latest");

    if (total > 0) {
      redirect(`/admin/pipeline?notice=${encodeURIComponent(`تم نشر ${total} مقالات الآن`)}`);
    }
    redirect(`/admin/pipeline?notice=${encodeURIComponent("لا توجد مقالات جاهزة للنشر الآن")}`);
  } catch {
    redirect(`/admin/pipeline?error=${encodeURIComponent("تعذر نشر المستحق الآن. تحقق من السجلات")}`);
  }
}

export async function processImagesNowAction(): Promise<void> {
  try {
    const result = await processPendingImages(5);
    revalidatePath("/admin/pipeline");
    revalidatePath("/");
    redirect(`/admin/pipeline?notice=${encodeURIComponent(`تمت معالجة ${result.generated} صور`)}`);
  } catch {
    redirect(`/admin/pipeline?error=${encodeURIComponent("فشلت معالجة الصور. تحقق من مفتاح OpenAI")}`);
  }
}

export async function deleteTopicAction(formData: FormData): Promise<void> {
  const topicId = String(formData.get("topicId") ?? "").trim();
  if (!topicId) return;

  try {
    const topic = await prisma.topicQueue.findUnique({
      where: { id: topicId },
      include: {
        article: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!topic) {
      redirect(`/admin/pipeline?error=${encodeURIComponent("الموضوع غير موجود")}`);
    }

    if (topic?.article) {
      if (topic.article.status === "PUBLISHED") {
        await prisma.article.update({
          where: { id: topic.article.id },
          data: { topicId: null },
        });
      } else {
        await prisma.article.delete({ where: { id: topic.article.id } });
      }
    }

    await prisma.topicQueue.delete({ where: { id: topicId } });
    revalidatePath("/admin/pipeline");
    revalidatePath("/");
    revalidatePath("/latest");
    revalidatePath("/popular");
    revalidateSeoPaths();
    redirect(`/admin/pipeline?notice=${encodeURIComponent("تم حذف الموضوع بنجاح")}`);
  } catch {
    redirect(`/admin/pipeline?error=${encodeURIComponent("تعذر حذف الموضوع. قد يكون مرتبطًا بسجل آخر")}`);
  }
}
