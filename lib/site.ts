import { absoluteUrl } from "@/lib/utils";

export const siteConfig = {
  name: "معلومة",
  latinName: "Ma'louma",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://malooma.org",
  editorialEmail: "editorial@malooma.org",
  country: "السعودية",
  foundingDate: "2026",
  description:
    "منصة معرفة عربية تغطي موضوعات الطبخ والصحة والتقنية والتعليم والإسلام والرياضة عبر مقالات منظمة ومراجعة تحريريا.",
  socialLinks: [
    "https://www.facebook.com/malooma.org",
    "https://x.com/malooma_org",
    "https://www.instagram.com/malooma_org",
    "https://www.linkedin.com/company/malooma",
  ],
};

export function siteLogoUrl() {
  return absoluteUrl("/logo.png");
}
