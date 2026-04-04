import type { Metadata } from "next";
import { renderStaticPage } from "@/lib/static-page-renderer";

export async function generateMetadata(): Promise<Metadata> {
  return (await renderStaticPage("contact")).metadata;
}

export default async function ContactPage() {
  return (await renderStaticPage("contact")).node;
}
