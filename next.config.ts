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
    return [
      {
        source: "/sitemaps/:path*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=86400, stale-while-revalidate=86400" }],
      },
      {
        source: "/articles/:path*",
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
