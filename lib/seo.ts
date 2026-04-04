import type { Metadata } from "next";
import { absoluteUrl, truncate } from "@/lib/utils";

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

  return {
    title,
    description,
    alternates: {
      canonical,
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
      images: input.image ? [{ url: input.image, width: 1200, height: 630, alt: input.title }] : undefined,
      siteName: "معلومة",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: input.image ? [input.image] : undefined,
    },
  };
}

export function jsonLdScript(data: Record<string, unknown>) {
  return {
    __html: JSON.stringify(data),
  };
}

