import type { Metadata } from "next";
import { renderStaticPage } from "@/lib/static-page-renderer";

export async function generateMetadata(): Promise<Metadata> {
  return (await renderStaticPage("about-us")).metadata;
}

export default async function AboutUsPage() {
  return (await renderStaticPage("about-us")).node;
}
