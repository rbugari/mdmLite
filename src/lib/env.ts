import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXT_PUBLIC_APP_NAME: z.string().default("MDM Lite"),
  APP_ADMIN_EMAIL: z.string().email().default("admin@mdmlite.local"),
  APP_PORT: z.string().default("3003"),
});

const parsedEnv = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  APP_ADMIN_EMAIL: process.env.APP_ADMIN_EMAIL,
  APP_PORT: process.env.APP_PORT,
});

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`);
}

export const env = parsedEnv.data;