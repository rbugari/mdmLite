import { CandidatesPageClient } from "@/components/candidates-page-client";
import { requireAdminPage } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

export default async function CandidatesPage() {
  await requireAdminPage("/candidates");
  return <CandidatesPageClient />;
}
