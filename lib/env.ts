import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  ADMIN_BASIC_AUTH_USER: z.string().optional(),
  ADMIN_BASIC_AUTH_PASS: z.string().optional(),
  REDIS_URL: z.string().optional(),
  MEILI_HOST: z.string().optional(),
  MEILI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
