"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { RepoSummary } from "@/lib/github";

export default function RepoPicker() {
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/github/repos", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error || "Failed to load repos");
        return data as { repos: RepoSummary[] };
      })
      .then((data) => {
        if (!cancelled) setRepos(data.repos);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Your GitHub repositories</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Pick a repo to generate code in. Changes are committed to a new
            branch and a PR is opened — your default branch is never touched.
          </p>
        </div>
        <input
          type="search"
          placeholder="Filter…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading repositories…</p>
        ) : error ? (
          <p className="text-sm text-red-400">Error: {error}</p>
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
