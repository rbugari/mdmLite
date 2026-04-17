import { ApprovalsPageClient } from "@/components/approvals-page-client";
import { requireAdminPage } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  await requireAdminPage("/approvals");
  return <ApprovalsPageClient />;
}
