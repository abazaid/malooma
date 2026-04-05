import { truncate } from "@/lib/utils";

type CategorySeoInput = {
  categoryName: string;
  subcategoriesCount: number;
  articlesCount: number;
};

type SubcategorySeoInput = {
  categoryName: string;
  subcategoryName: string;
  articlesCount: number;
};

export function buildCategorySeo(input: CategorySeoInput) {
  const title = `${input.categoryName}: دليل شامل لأحدث المقالات والموضوعات`;
  const description = truncate(
    `اكتشف قسم ${input.categoryName} على معلومة: محتوى عربي موثوق، شروحات عملية، وتغطية متجددة تشمل ${input.subcategoriesCount.toLocaleString(
      "ar-SA",
    )} تصنيفًا فرعيًا وأكثر من ${input.articlesCount.toLocaleString("ar-SA")} مقالًا.`,
    155,
  );

  const intro = `قسم ${input.categoryName} يقدّم أرشيفًا معرفيًا منظمًا يجمع بين الشرح المبسّط والطرح العملي لمختلف الموضوعات المرتبطة بالقسم. ستجد هنا مقالات حديثة، ومسارات تصفح واضحة عبر ${
    input.subcategoriesCount
  } تصنيفًا فرعيًا، لتصل بسرعة إلى المعلومة التي تحتاجها دون تشتيت.`;

  return {
    title,
    description,
    intro,
  };
}

export function buildSubcategorySeo(input: SubcategorySeoInput) {
  const title = `${input.subcategoryName} ضمن ${input.categoryName}: مقالات وشروحات عملية`;
  const description = truncate(
    `تصفح مقالات ${input.subcategoryName} ضمن قسم ${input.categoryName} على معلومة. محتوى عربي متجدد يقدّم إجابات واضحة، خطوات عملية، ونصائح قابلة للتطبيق عبر ${input.articlesCount.toLocaleString(
      "ar-SA",
    )} مقالًا.`,
    155,
  );

  const intro = `صفحة ${input.subcategoryName} تجمع أهم المقالات المرتبطة بهذا الموضوع داخل قسم ${input.categoryName}، مع ترتيب واضح يساعدك على البدء من الأساسيات ثم الانتقال إلى التفاصيل والتطبيقات العملية. الهدف هو تقديم محتوى مفيد وقابل للتنفيذ، وليس مجرد معلومات عامة.`;

  return {
    title,
    description,
    intro,
  };
}

