"use client";

import { Database } from "lucide-react";
import { useEffect, useState } from "react";

type DbStatusCopy = {
  checking: string;
  connected: string;
  disconnected: string;
};

type DbStatusState = "checking" | "connected" | "disconnected";

export function DbStatusIndicator({ copy }: { copy: DbStatusCopy }) {
  const [status, setStatus] = useState<DbStatusState>("checking");

  useEffect(() => {
    let isMounted = true;

    async function checkStatus() {
      try {
        const response = await fetch("/api/health/db", { cache: "no-store" });

        if (!isMounted) {
          return;
        }

        setStatus(response.ok ? "connected" : "disconnected");
      } catch {
        if (isMounted) {
          setStatus("disconnected");
        }
      }
    }

    void checkStatus();
    const intervalId = window.setInterval(() => {
      void checkStatus();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const label = status === "connected" ? copy.connected : status === "disconnected" ? copy.disconnected : copy.checking;

  return (
    <div className="db-status-indicator" aria-label={label} title={label} role="status">
      <Database size={16} aria-hidden="true" />
      <span className={`db-status-indicator__dot db-status-indicator__dot--${status}`} aria-hidden="true" />
    </div>
  );
}