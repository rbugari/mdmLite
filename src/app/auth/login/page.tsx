"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type LoginResult = {
  ok: boolean;
  error?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      identifier: String(formData.get("identifier") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
    };

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as LoginResult;

      if (!response.ok || !result.ok) {
        setError(result.error ?? "Login failed.");
        return;
      }

      router.push(next);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unknown login error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-shell page-shell--narrow">
      <section className="table-panel table-panel--padded">
        <span className="eyebrow">Authentication</span>
        <h1>Admin login</h1>
        <p>Sign in with the system admin account to manage rules and approvals. This is separate from the database user.</p>

        <form onSubmit={(event) => void handleSubmit(event)} className="inline-form-grid" style={{ marginTop: 16 }}>
          <label className="form-field">
            <span>System user</span>
            <input name="identifier" type="text" required autoComplete="username" defaultValue="admin" />
          </label>
          <label className="form-field">
            <span>Password</span>
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <div className="form-actions form-field--full">
            <button type="submit" className="hero-link hero-link--primary" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
            {error ? <span className="form-status form-status--error">{error}</span> : null}
          </div>
        </form>
      </section>
    </main>
  );
}
