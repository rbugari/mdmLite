import { env } from "@/lib/env";

export const appConfig = {
  name: env.NEXT_PUBLIC_APP_NAME,
  adminEmail: env.APP_ADMIN_EMAIL,
  appPort: env.APP_PORT,
};
