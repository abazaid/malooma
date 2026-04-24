import type { Metadata } from "next";
import { siteLogoUrl } from "@/lib/site";
import { absoluteUrl, truncate } from "@/lib/utils";

function absoluteImageUrl(image?: string) {
  if (!image) return siteLogoUrl();
  if (/^https?:\/\//i.test(image)) return image;
  return absoluteUrl(image);
}

export function buildMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const title = `${input.title} | معلومة`;
  const description = truncate(input.description, 160);
  const canonical = absoluteUrl(input.path);
  const image = absoluteImageUrl(input.image);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        ar: canonical,
        "ar-SA": canonical,
      },
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, nocache: false },
    openGraph: {
      type: "website",
      locale: "ar_SA",
      title,
      description,
      url: canonical,
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
      siteName: "معلومة",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export function jsonLdScript(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify(data),
  };
}
