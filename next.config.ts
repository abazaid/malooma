import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
      {
        key: "Content-Security-Policy",
        value:
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://pagead2.googlesyndication.com; frame-src https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
      },
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/sitemaps/:path*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=86400" }],
      },
      {
        source: "/articles/:path*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=1800, stale-while-revalidate=86400" }],
      },
      {
        source: "/categories/:path*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=1800, stale-while-revalidate=86400" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/عن_موضوع", destination: "/about", permanent: true },
      { source: "/معاييرنا_للتدقيق", destination: "/editorial-standards", permanent: true },
      { source: "/اتصل_بنا", destination: "/contact", permanent: true },
      { source: "/سياسة_الخصوصية", destination: "/privacy", permanent: true },
      { source: "/اتفاقية_الاستخدام", destination: "/terms", permanent: true },
      { source: "/فريق_موضوع", destination: "/team", permanent: true },
      { source: "/خاص\\:أجدد_الصفحات", destination: "/latest", permanent: true },
      { source: "/خاص\\:الصفحات_الأكثر_مشاهدة", destination: "/popular", permanent: true },
    ];
  },
};

export default nextConfig;
