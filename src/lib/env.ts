import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_SSL_MODE: z.enum(["disable", "require", "no-verify"]).default("require"),
  NEXT_PUBLIC_APP_NAME: z.string().default("MDM Lite"),
  APP_ADMIN_USERNAME: z.string().min(1).default("admin"),
  APP_ADMIN_EMAIL: z.string().email().default("admin@mdmlite.local"),
  APP_ADMIN_PASSWORD: z.string().min(1).default("change-this-password"),
  APP_AUTH_SECRET: z.string().min(16).default("change-this-secret-now"),
  APP_PORT: z.string().default("3003"),
  // LLM configuration (v0.4 document discovery). Optional - feature disabled when absent.
  LLM_PROVIDER: z.enum(["openai", "azure-openai", "none"]).default("none"),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().default("gpt-4o-mini"),
  LLM_AZURE_ENDPOINT: z.string().optional(),
  // Ingest API key (v0.5 external candidate input). Optional - batch endpoint disabled when absent.
  INGEST_API_KEY: z.string().min(32).optional(),
  // Optional v0.8 automation threshold. Only candidates above threshold and without human review are auto-promoted.
  INGEST_MIN_CONFIDENCE_AUTOPROMOTE: z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === "") return undefined;
      if (typeof value === "string") return Number(value);
      return value;
    },
    z.number().min(0).max(1).optional(),
  ),
});

const parsedEnv = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_SSL_MODE: process.env.DATABASE_SSL_MODE,
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  APP_ADMIN_USERNAME: process.env.APP_ADMIN_USERNAME,
  APP_ADMIN_EMAIL: process.env.APP_ADMIN_EMAIL,
  APP_ADMIN_PASSWORD: process.env.APP_ADMIN_PASSWORD,
  APP_AUTH_SECRET: process.env.APP_AUTH_SECRET,
  APP_PORT: process.env.APP_PORT,
  LLM_PROVIDER: process.env.LLM_PROVIDER,
  LLM_API_KEY: process.env.LLM_API_KEY,
  LLM_MODEL: process.env.LLM_MODEL,
  LLM_AZURE_ENDPOINT: process.env.LLM_AZURE_ENDPOINT,
  INGEST_API_KEY: process.env.INGEST_API_KEY,
  INGEST_MIN_CONFIDENCE_AUTOPROMOTE: process.env.INGEST_MIN_CONFIDENCE_AUTOPROMOTE,
});

if (!parsedEnv.success) {
  throw new Error(`Invalid environment configuration: ${parsedEnv.error.message}`);
}

export const env = parsedEnv.data;