import type { Metadata } from "next";
import { renderStaticPage } from "@/lib/static-page-renderer";

export async function generateMetadata(): Promise<Metadata> {
  return (await renderStaticPage("about")).metadata;
}

export default async function AboutPage() {
  return (await renderStaticPage("about")).node;
}
