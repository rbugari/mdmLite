import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_SSL_MODE: z.enum(["disable", "require", "no-verify"]).default("require"),
  NEXT_PUBLIC_APP_NAME: z.string().default("MDM Lite"),
  APP_ADMIN_EMAIL: z.string().email().default("admin@mdmlite.local"),
  APP_ADMIN_PASSWORD: z.string().min(8).default("change-this-password"),
  APP_AUTH_SECRET: z.string().min(16).default("change-this-secret-now"),
  APP_PORT: z.string().default("3003"),
});

const parsedEnv = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_SSL_MODE: process.env.DATABASE_SSL_MODE,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  APP_ADMIN_EMAIL: process.env.APP_ADMIN_EMAIL,
  APP_ADMIN_PASSWORD: process.env.APP_ADMIN_PASSWORD,
  APP_AUTH_SECRET: process.env.APP_AUTH_SECRET,
  APP_PORT: process.env.APP_PORT,
});

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`);
}

export const env = parsedEnv.data;