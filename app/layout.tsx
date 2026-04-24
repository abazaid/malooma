import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig, siteLogoUrl } from "@/lib/site";
import { absoluteUrl } from "@/lib/utils";

const droidArabicKufi = localFont({
  src: "../public/fonts/DroidArabicKufi-Regular.woff",
  variable: "--font-droid-arabic-kufi",
  display: "swap",
});

const googleAnalyticsId = "G-GWPTCKDRZG";
const googleAdsenseId = "ca-pub-8046020805959286";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://malooma.org"),
  title: siteConfig.name,
  description: siteConfig.description,
  alternates: {
    canonical: absoluteUrl("/"),
    languages: {
      ar: absoluteUrl("/"),
      "ar-SA": absoluteUrl("/"),
    },
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    type: "website",
    locale: "ar_SA",
    url: absoluteUrl("/"),
    images: [{ url: siteLogoUrl(), width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteLogoUrl()],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${droidArabicKufi.variable} h-full`}>
      <head>
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${googleAdsenseId}`}
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full bg-slate-100 font-sans text-slate-900 antialiased">
        <Script async src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`} />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAnalyticsId}');
          `}
        </Script>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: siteConfig.name,
            alternateName: siteConfig.latinName,
            url: absoluteUrl("/"),
            description: siteConfig.description,
            foundingDate: siteConfig.foundingDate,
            areaServed: "Arabic-speaking countries",
            email: siteConfig.editorialEmail,
            address: {
              "@type": "PostalAddress",
              addressCountry: siteConfig.country,
            },
            logo: {
              "@type": "ImageObject",
              url: siteLogoUrl(),
              width: 1200,
              height: 630,
            },
            sameAs: siteConfig.socialLinks,
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: siteConfig.name,
            alternateName: siteConfig.latinName,
            url: absoluteUrl("/"),
            inLanguage: "ar",
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
