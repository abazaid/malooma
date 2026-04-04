import { Meilisearch } from "meilisearch";

export function getMeiliClient() {
  const host = process.env.MEILI_HOST;
  if (!host) return null;

  return new Meilisearch({
    host,
    apiKey: process.env.MEILI_API_KEY,
  });
}

