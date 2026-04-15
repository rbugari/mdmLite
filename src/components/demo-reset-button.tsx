"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useUiPreferences } from "@/components/ui-preferences-provider";
import { getCopy } from "@/lib/copy";

type DemoResetResponse = {
  ok: boolean;
  error?: string;
  report?: {
    validations?: {
      counts?: {
        mappings_total?: number;
        groups_total?: number;
        parameters_total?: number;
        mappings_pending?: number;
        groups_pending?: number;
        parameters_pending?: number;
      };
    };
  };
};

type DemoResetButtonProps = {
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function DemoResetButton({ secondaryHref = "/help/functional", secondaryLabel }: DemoResetButtonProps) {
  const router = useRouter();
  const { language } = useUiPreferences();
  const t = getCopy(language).home.demoReset;
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<DemoResetResponse | null>(null);

  async function handleReset() {
    if (!window.confirm(t.confirm)) {
      return;
    }

    setIsBusy(true);
    setStatus(null);

    try {
      const response = await fetch("/api/demo/reset", { method: "POST" });
      const payload = (await response.json()) as DemoResetResponse;
      setStatus(payload);

      if (response.ok && payload.ok) {
        router.refresh();
      }
    } catch (error) {
      setStatus({ ok: false, error: error instanceof Error ? error.message : t.error });
    } finally {
      setIsBusy(false);
    }
  }

  const counts = status?.report?.validations?.counts;
  const pendingCount = (counts?.mappings_pending ?? 0) + (counts?.groups_pending ?? 0) + (counts?.parameters_pending ?? 0);

  return (
    <div>
      <span className="eyebrow">{t.eyebrow}</span>
      <h3>{t.title}</h3>
      <p>{t.description}</p>
      <div className="hero-actions">
        <button type="button" className="hero-link hero-link--primary" onClick={() => void handleReset()} disabled={isBusy}>
          {isBusy ? t.processing : t.cta}
        </button>
        <Link href={secondaryHref} className="hero-link">
          {secondaryLabel ?? t.helpCta}
        </Link>
      </div>
      {status ? (
        status.ok ? (
          <p>{`${t.success} ${counts?.mappings_total ?? 0}/${counts?.groups_total ?? 0}/${counts?.parameters_total ?? 0} · pending ${pendingCount}`}</p>
        ) : (
          <p>{`${t.error}: ${status.error ?? "unknown error"}`}</p>
        )
      ) : (
        <p>{t.note}</p>
      )}
    </div>
  );
}