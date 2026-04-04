"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { slugifyArabic } from "@/lib/slug";
import { enqueueManualTopic, intakeTopicsFromReference } from "@/lib/pipeline/topic-intake";
import { processPendingImages, publishDueArticles, runContentPipeline } from "@/lib/pipeline/engine";

type ActionResult = { ok: boolean; message: string };

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

  await withGuard(async () => {
    await enqueueManualTopic(title);
    revalidatePath("/admin/pipeline");
  });
}

export async function importAllReferenceTopicsAction(): Promise<void> {
  await withGuard(async () => {
    await intakeTopicsFromReference();
    revalidatePath("/admin/pipeline");
  });
}

export async function runPipelineNowAction(): Promise<void> {
  await withGuard(async () => {
    await runContentPipeline({ intake: false, dailyLimit: 5, scheduleBatch: 5 });
    revalidatePath("/admin/pipeline");
    revalidatePath("/admin");
  });
}

export async function startManualPublishingSystemAction(): Promise<void> {
  await withGuard(async () => {
    // Manual run outside cron. This does not alter cron schedules.
    await runContentPipeline({ intake: false, dailyLimit: 5, scheduleBatch: 5 });
    revalidatePath("/admin/pipeline");
    revalidatePath("/admin");
  });
}

export async function publishDueNowAction(): Promise<void> {
  await withGuard(async () => {
    await publishDueArticles(5);
    revalidatePath("/admin/pipeline");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/latest");
  });
}

export async function processImagesNowAction(): Promise<void> {
  await withGuard(async () => {
    await processPendingImages(5);
    revalidatePath("/admin/pipeline");
    revalidatePath("/");
  });
}
