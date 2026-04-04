import type { Metadata } from "next";
import { renderStaticPage } from "@/lib/static-page-renderer";

export async function generateMetadata(): Promise<Metadata> {
  return (await renderStaticPage("privacy")).metadata;
}

export default async function PrivacyPage() {
  return (await renderStaticPage("privacy")).node;
}
