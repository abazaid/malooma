import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatArabicDate(date: Date | string) {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(value);
}

export function absoluteUrl(path: string) {
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "https://malooma.org";
  return new URL(path, origin).toString();
}

export function truncate(text: string, length = 155) {
  if (text.length <= length) return text;
  return `${text.slice(0, length - 1)}…`;
}
