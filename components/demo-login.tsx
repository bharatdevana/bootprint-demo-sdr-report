"use client";

import { FormEvent, useState } from "react";

function safeDestination() {
  const requested = new URLSearchParams(window.location.search).get("next");
  return requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/";
}

export function DemoLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unable to sign in.");
      window.location.assign(safeDestination());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to sign in.");
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#eef0ff] px-5 py-8 sm:px-8 sm:py-12">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl overflow-hidden rounded-2xl border border-[#dcddea] bg-white shadow-[0_24px_80px_rgba(33,21,61,0.08)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="flex flex-col justify-between bg-[#21153d] p-8 text-white sm:p-12 lg:p-16">
          <div className="brand-wordmark">CLIK<span>/</span>WORKS</div>
          <div className="my-16 max-w-xl lg:my-0">
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-[#43ef81]">Account research</p>
            <h1 className="max-w-lg text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-6xl">
              One company URL. One consistent account brief.
            </h1>
            <p className="mt-7 max-w-md text-base leading-7 text-white/65">
              This shared demo uses public company information and fixed ClikWorks qualification rules.
            </p>
          </div>
          <p className="text-xs text-white/40">For workshop use. New research runs are rate limited.</p>
        </section>

        <section className="grid place-items-center p-8 sm:p-12 lg:p-16">
          <form className="w-full max-w-sm" onSubmit={submit}>
            <div className="mb-8 grid h-12 w-12 place-items-center rounded-xl bg-[#eef0ff] text-xl text-[#21153d]">↗</div>
            <h2 className="text-3xl font-semibold tracking-[-0.035em]">Open the demo</h2>
            <p className="mt-3 text-sm leading-6 text-[#68636f]">Use the shared password provided with the workshop resources.</p>
            <label className="mt-8 block text-sm font-semibold" htmlFor="demo-password">Demo password</label>
            <input
              autoComplete="current-password"
              autoFocus
              className="mt-2 w-full rounded-lg border border-[#d8d8d2] bg-white px-4 py-3 outline-none transition focus:border-[#13a953] focus:ring-4 focus:ring-[#43ef81]/15"
              id="demo-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            <button
              className="mt-5 w-full rounded-lg bg-[#17151b] px-4 py-3 font-semibold text-white transition hover:bg-[#21153d] disabled:cursor-wait disabled:opacity-55"
              disabled={submitting}
              type="submit"
            >
              {submitting ? "Opening…" : "Open account research"}
            </button>
            <p aria-live="polite" className="mt-4 min-h-6 text-sm text-[#b42318]" role="alert">{error}</p>
            <p className="mt-7 text-xs leading-5 text-[#817c87]">The session lasts 12 hours on this browser.</p>
          </form>
        </section>
      </div>
    </main>
  );
}
