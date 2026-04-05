import { tokenizeArabic } from "@/lib/pipeline/text-utils";

export type GeneratedOutline = {
  searchIntent: string;
  h1: string;
  h2: string[];
  h3: string[];
  faq: { q: string; aHint: string }[];
  keyPoints: string[];
  conclusion: string;
  lsiKeywords: string[];
};

export function generateOutline(title: string): GeneratedOutline {
  const tokens = tokenizeArabic(title);
  const core = tokens.slice(0, 4).join(" ") || title;
  const inferredAngle = title.includes("أسباب")
    ? "الأسباب"
    : title.includes("نتائج")
      ? "النتائج"
      : title.includes("دروس")
        ? "الدروس"
        : "الشرح المبسّط";

  return {
    searchIntent: `المستخدم يريد ${inferredAngle} حول ${title} بشكل مباشر وقابل للتطبيق.`,
    h1: title,
    h2: [
      `ما المقصود بـ ${core}؟`,
      `الأسباب والعوامل المؤثرة في ${core}`,
      `خطوات عملية للتعامل مع ${core}`,
      `أخطاء شائعة عند تطبيق ${core}`,
      `نصائح متقدمة لتحسين النتائج`,
    ],
    h3: [
      `كيفية تقييم الوضع الحالي`,
      `أدوات تساعدك على التنفيذ`,
      `متى تحتاج إلى خبير أو استشارة إضافية`,
    ],
    faq: [
      { q: `ما أهم فائدة من فهم ${title}؟`, aHint: "تحسين القرار وتجنب الأخطاء المتكررة." },
      { q: `كم يحتاج تطبيق ${title} من وقت؟`, aHint: "يعتمد على الهدف، لكن البدء يكون بخطوات صغيرة يومية." },
      { q: `ما أكثر خطأ شائع؟`, aHint: "الانتقال للحلول قبل تحديد السبب الحقيقي للمشكلة." },
    ],
    keyPoints: [
      "ابدأ بالتشخيص قبل التنفيذ.",
      "ضع خطوات قصيرة قابلة للقياس.",
      "تابع النتائج وعدّل الخطة بشكل دوري.",
      "اربط المعرفة النظرية بالتطبيق العملي.",
    ],
    conclusion: `النجاح في ${title} يعتمد على فهم الأساسيات، تطبيق متدرج، ومراجعة مستمرة للنتائج.`,
    lsiKeywords: [...new Set([core, ...tokens.slice(0, 8)])],
  };
}
