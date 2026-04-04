import type { Metadata } from "next";
import { renderStaticPage } from "@/lib/static-page-renderer";

export async function generateMetadata(): Promise<Metadata> {
  return (await renderStaticPage("editorial-standards")).metadata;
}

export default async function EditorialStandardsPage() {
  return (await renderStaticPage("editorial-standards")).node;
}
