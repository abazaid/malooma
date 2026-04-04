import { prisma } from "@/lib/prisma";
import { loadReferenceTaxonomy, MAIN_CATEGORY_NAMES } from "@/lib/reference-loader";
import { slugifyArabic } from "@/lib/slug";
import { logPipelineEvent } from "@/lib/pipeline/events";

export async function importReferenceTaxonomyToDb() {
  const taxonomy = await loadReferenceTaxonomy();

  let mainUpserts = 0;
  let subUpserts = 0;

  const mainCategoryMap = new Map<string, { id: string; slug: string }>();

  for (const [index, mainName] of MAIN_CATEGORY_NAMES.entries()) {
    const slug = slugifyArabic(mainName);
    const main = await prisma.category.upsert({
      where: { slug },
      create: {
        name: mainName,
        slug,
        level: 1,
        sortOrder: index,
        description: `قسم رئيسي: ${mainName}`,
        isActive: true,
      },
      update: {
        name: mainName,
        level: 1,
        sortOrder: index,
        isActive: true,
      },
      select: { id: true, slug: true },
    });
    mainCategoryMap.set(mainName, main);
    mainUpserts += 1;
  }

  for (const row of taxonomy) {
    if (row.name === row.parentName) continue;
    const parent = mainCategoryMap.get(row.parentName) ?? mainCategoryMap.get("منوعات");
    if (!parent) continue;

    await prisma.category.upsert({
      where: { slug: row.slug },
      create: {
        name: row.name,
        slug: row.slug,
        level: 2,
        parentId: parent.id,
        description: `تصنيف فرعي ضمن ${row.parentName}`,
        isActive: true,
      },
      update: {
        name: row.name,
        level: 2,
        parentId: parent.id,
        isActive: true,
      },
    });
    subUpserts += 1;
  }

  await logPipelineEvent({
    stage: "TAXONOMY_IMPORT",
    status: "SUCCESS",
    message: `Imported taxonomy. main=${mainUpserts}, sub=${subUpserts}`,
    metaJson: {
      mainUpserts,
      subUpserts,
      source: "reference-data/mawdoo3_categories.txt",
    },
  });

  return { mainUpserts, subUpserts };
}
