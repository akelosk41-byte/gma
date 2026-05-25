"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { RepoSummary } from "@/lib/github";
import { loadGithubToken } from "@/lib/settings";

export default function RepoPicker() {
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hasToken, setHasToken] = useState(false);

  const load = async () => {
    setError(null);
    setLoading(true);
    setRepos([]);
    try {
      const token = loadGithubToken();
      if (!token) {
        throw new Error(
          "No GitHub token saved. Add one above and click Save first.",
        );
      }
      const r = await fetch("/api/github/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubToken: token }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `Request failed: ${r.status}`);
      setRepos((data.repos as RepoSummary[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = loadGithubToken();
    setHasToken(!!t);
    if (t) {
      void load();
    }
    // Listen for storage changes so the list reloads after saving a token.
    const handler = () => {
      const tok = loadGithubToken();
      setHasToken(!!tok);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return repos;
    const q = query.trim().toLowerCase();
    return repos.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }, [repos, query]);

  return (
    <section className="rounded-2xl border border-border bg-panel p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Your GitHub repositories</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Pick a repo to generate code in. Changes go to a new branch and a
            PR — your default branch is never touched.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Filter…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <button
            type="button"
            onClick={() => void load()}
            disabled={!hasToken || loading}
            className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm hover:border-accent"
          >
            {loading ? "Loading…" : repos.length ? "Reload" : "Load repos"}
          </button>
        </div>
      </div>

      <div className="mt-4">
        {!hasToken ? (
          <p className="rounded-lg border border-yellow-700/40 bg-yellow-900/20 px-3 py-2 text-sm text-yellow-200">
            Save a GitHub token in the settings card above to load your repos.
          </p>
        ) : error ? (
          <p className="text-sm text-red-400">Error: {error}</p>
        ) : loading ? (
          <p className="text-sm text-zinc-400">Loading repositories…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-zinc-400">No repositories found.</p>
        ) : (
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
            {filtered.slice(0, 200).map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link
                    href={`/projects/${encodeURIComponent(r.owner)}/${encodeURIComponent(r.name)}`}
                    className="block truncate font-medium"
                  >
                    {r.full_name}
                  </Link>
                  {r.description ? (
                    <p className="truncate text-xs text-zinc-500">
                      {r.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs">
                  {r.private ? (
                    <span className="rounded-full border border-border px-2 py-0.5 text-zinc-400">
                      private
                    </span>
                  ) : (
                    <span className="rounded-full border border-border px-2 py-0.5 text-zinc-500">
                      public
                    </span>
                  )}
                  <span className="rounded-full border border-border px-2 py-0.5 text-zinc-500">
                    {r.default_branch}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
