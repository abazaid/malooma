"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { slugifyArabic } from "@/lib/slug";

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

async function resolveUniqueArticleSlug(baseSlug: string, articleId: string): Promise<string> {
  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    const existing = await prisma.article.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === articleId) return candidate;
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

export async function updateUnpublishedArticleAction(formData: FormData): Promise<void> {
  const articleId = String(formData.get("articleId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim();
  const categorySlug = String(formData.get("categorySlug") ?? "").trim();
  const heroImageUrl = String(formData.get("heroImageUrl") ?? "").trim();

  if (!articleId || !title || !excerpt || !categorySlug) {
    redirect(`/admin/articles?error=${encodeURIComponent("الحقول الأساسية مطلوبة")}`);
  }

  try {
    const [article, category] = await Promise.all([
      prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true, slug: true, heroMediaId: true },
      }),
      prisma.category.findUnique({
        where: { slug: categorySlug },
        select: { id: true },
      }),
    ]);

    if (!article || !category) {
      redirect(`/admin/articles?error=${encodeURIComponent("المقال أو التصنيف غير موجود")}`);
    }

    const slug = await resolveUniqueArticleSlug(slugifyArabic(title), article.id);
    let heroMediaId = article.heroMediaId;

    if (heroImageUrl) {
      const media = await prisma.media.create({
        data: {
          fileName: `${slug}-${Date.now()}.jpg`,
          mimeType: "image/jpeg",
          storageKey: `external/${slug}-${Date.now()}.jpg`,
          url: heroImageUrl,
          altText: title,
        },
      });
      heroMediaId = media.id;
    }

    await prisma.article.update({
      where: { id: article.id },
      data: {
        title,
        slug,
        excerpt,
        categoryId: category.id,
        heroMediaId: heroMediaId ?? undefined,
      },
    });

    revalidatePath("/admin/articles");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/latest");
    revalidateSeoPaths();
    redirect(`/admin/articles?notice=${encodeURIComponent("تم تحديث المقال غير المنشور")}`);
  } catch {
    redirect(`/admin/articles?error=${encodeURIComponent("تعذر تحديث المقال")}`);
  }
}

export async function toggleArticleStatusAction(formData: FormData): Promise<void> {
  const articleId = String(formData.get("articleId") ?? "").trim();
  const nextStatus = String(formData.get("nextStatus") ?? "").trim();
  if (!articleId || !["DRAFT", "PUBLISHED"].includes(nextStatus)) {
    redirect(`/admin/articles?error=${encodeURIComponent("بيانات الحالة غير صحيحة")}`);
  }

  try {
    await prisma.article.update({
      where: { id: articleId },
      data: {
        status: nextStatus as "DRAFT" | "PUBLISHED",
        publishedAt: nextStatus === "PUBLISHED" ? new Date() : null,
      },
    });

    revalidatePath("/admin/articles");
    revalidatePath("/");
    revalidatePath("/latest");
    revalidatePath("/popular");
    revalidateSeoPaths();
    redirect(
      `/admin/articles?notice=${encodeURIComponent(
        nextStatus === "PUBLISHED" ? "تم نشر المقال" : "تم تحويل المقال إلى مسودة",
      )}`,
    );
  } catch {
    redirect(`/admin/articles?error=${encodeURIComponent("تعذر تغيير حالة المقال")}`);
  }
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
