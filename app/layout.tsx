import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/utils";

const droidArabicKufi = localFont({
  src: "../public/fonts/DroidArabicKufi-Regular.woff",
  variable: "--font-droid-arabic-kufi",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://malooma.org"),
  title: "معلومة",
  description: "منصة محتوى عربية واسعة التنظيم، سريعة، ومهيأة تقنيًا لمحركات البحث.",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: "معلومة",
    description: "مقالات عربية منظّمة ضمن تصنيفات واضحة وتجربة قراءة عملية.",
    type: "website",
    locale: "ar_SA",
    url: absoluteUrl("/"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${droidArabicKufi.variable} h-full`}>
      <body className="min-h-full bg-slate-100 font-sans text-slate-900 antialiased">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "معلومة",
            url: absoluteUrl("/"),
            logo: absoluteUrl("/favicon.ico"),
            sameAs: ["https://www.facebook.com", "https://x.com", "https://instagram.com"],
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "معلومة",
            url: absoluteUrl("/"),
            potentialAction: {
              "@type": "SearchAction",
              target: `${absoluteUrl("/search/results")}?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }}
        />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:right-2 focus:bg-white focus:px-3 focus:py-2">
          تخط إلى المحتوى
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
