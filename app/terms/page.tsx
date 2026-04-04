import type { Metadata } from "next";
import { renderStaticPage } from "@/lib/static-page-renderer";

export async function generateMetadata(): Promise<Metadata> {
  return (await renderStaticPage("terms")).metadata;
}

export default async function TermsPage() {
  return (await renderStaticPage("terms")).node;
}
