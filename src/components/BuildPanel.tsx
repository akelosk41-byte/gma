"use client";

import { useEffect, useMemo, useState } from "react";
import type { CloseRouterModel } from "@/lib/closerouter";
import {
  loadApiKey,
  loadBaseUrl,
  loadGithubToken,
  loadSelectedModel,
  saveSelectedModel,
} from "@/lib/settings";

interface BuildResult {
  ok: boolean;
  branch?: string;
  commitSha?: string;
  prUrl?: string;
  prNumber?: number;
  summary?: string;
  files?: Array<{ path: string; bytes: number }>;
  error?: string;
}

export default function BuildPanel({
  owner,
  repo,
}: {
  owner: string;
  repo: string;
}) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [githubToken, setGhToken] = useState("");
  const [models, setModels] = useState<CloseRouterModel[]>([]);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [model, setModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [openPr, setOpenPr] = useState(true);

  useEffect(() => {
    const k = loadApiKey();
    const b = loadBaseUrl();
    const g = loadGithubToken();
    const m = loadSelectedModel();
    setApiKey(k);
    setBaseUrl(b);
    setGhToken(g);
    if (m) setModel(m);
    if (k) {
      void (async () => {
        try {
          const res = await fetch("/api/models", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ apiKey: k, baseUrl: b }),
          });
          const data = await res.json();
          if (res.ok) {
            const list = (data.models as CloseRouterModel[]) ?? [];
            setModels(list);
            if (!m && list.length > 0) setModel(list[0].id);
          }
        } catch {
          // ignore — user can still click Load models manually
        }
      })();
    }
  }, []);

  const fetchModels = async () => {
    setModelsError(null);
    setModelsLoading(true);
    setModels([]);
    try {
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, baseUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      const list = (data.models as CloseRouterModel[]) ?? [];
      setModels(list);
      if (list.length > 0 && !model) {
        setModel(list[0].id);
      }
    } catch (err) {
      setModelsError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setModelsLoading(false);
    }
  };

  const canRun = useMemo(
    () =>
      !!apiKey &&
      !!githubToken &&
      !!model &&
      prompt.trim().length > 3 &&
      !running,
    [apiKey, githubToken, model, prompt, running],
  );

  const handleRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          prompt,
          model,
          apiKey,
          baseUrl,
          githubToken,
          openPr,
        }),
      });
      const data = (await res.json()) as BuildResult;
      if (!res.ok) {
        setResult({
          ok: false,
          error: data?.error || `Request failed: ${res.status}`,
        });
      } else {
        setResult(data);
      }
    } catch (err) {
      setResult({
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-panel p-6">
      <h2 className="text-lg font-semibold">
        Generate changes for {owner}/{repo}
      </h2>
      <p className="mt-1 text-sm text-zinc-400">
        Describe what you want built. The AI sees a listing of your repo plus
        the contents of small text files. Generated changes go to a new branch
        with a PR.
      </p>

      {!apiKey || !githubToken ? (
        <p className="mt-3 rounded-lg border border-yellow-700/40 bg-yellow-900/20 px-3 py-2 text-sm text-yellow-200">
          Complete{" "}
          {!apiKey ? "Step 1 (CloseRouter API key)" : null}
          {!apiKey && !githubToken ? " and " : null}
          {!githubToken ? "Step 2 (Sign in with GitHub)" : null}{" "}
          on the{" "}
          <a href="/" className="underline">
            home page
          </a>{" "}
          first.
        </p>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">Model</span>
          {models.length === 0 ? (
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Click 'Load models' or type a model id"
            />
          ) : (
            <select
              value={model}
              onChange={(e) => {
                setModel(e.target.value);
                saveSelectedModel(e.target.value);
              }}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                  {m.owned_by ? ` — ${m.owned_by}` : ""}
                </option>
              ))}
            </select>
          )}
        </label>
        <button
          type="button"
          onClick={fetchModels}
          disabled={!apiKey || modelsLoading}
          className="h-[42px] shrink-0 rounded-lg border border-border px-4 text-sm hover:border-accent"
        >
          {modelsLoading ? "Loading…" : "Load models"}
        </button>
        <label className="flex h-[42px] shrink-0 items-center gap-2 rounded-lg border border-border px-3 text-sm">
          <input
            type="checkbox"
            checked={openPr}
            onChange={(e) => setOpenPr(e.target.checked)}
            className="!w-auto"
          />
          Open PR
        </label>
      </div>
      {modelsError ? (
        <p className="mt-2 text-sm text-red-400">{modelsError}</p>
      ) : null}

      <label className="mt-4 block text-sm">
        <span className="mb-1 block text-zinc-300">What should the AI build?</span>
        <textarea
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Add a /health endpoint that returns { status: 'ok' } and a unit test for it."
        />
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleRun}
          disabled={!canRun}
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:opacity-90"
        >
          {running ? "Running…" : "Build with AI"}
        </button>
        {running ? (
          <span className="text-sm text-zinc-400">
            This can take 30s–2min depending on the model.
          </span>
        ) : null}
      </div>

      {result ? <ResultBlock result={result} owner={owner} repo={repo} /> : null}
    </section>
  );
}

function ResultBlock({
  result,
  owner,
  repo,
}: {
  result: BuildResult;
  owner: string;
  repo: string;
}) {
  if (!result.ok) {
    return (
      <div className="mt-6 rounded-lg border border-red-800/50 bg-red-900/20 p-4">
        <p className="text-sm font-semibold text-red-300">Build failed</p>
        <pre className="mt-2 whitespace-pre-wrap text-xs text-red-200">
          {result.error}
        </pre>
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-lg border border-emerald-800/40 bg-emerald-900/20 p-4">
      <p className="text-sm font-semibold text-emerald-200">Build complete</p>
      {result.summary ? (
        <p className="mt-2 text-sm text-zinc-200">{result.summary}</p>
      ) : null}
      <ul className="mt-3 space-y-1 text-xs text-zinc-300">
        {result.branch ? (
          <li>
            <span className="text-zinc-500">Branch:</span>{" "}
            <a
              href={`https://github.com/${owner}/${repo}/tree/${result.branch}`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {result.branch}
            </a>
          </li>
        ) : null}
        {result.commitSha ? (
          <li>
            <span className="text-zinc-500">Commit:</span>{" "}
            <code>{result.commitSha.slice(0, 7)}</code>
          </li>
        ) : null}
        {result.prUrl ? (
          <li>
            <span className="text-zinc-500">PR:</span>{" "}
            <a
              href={result.prUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {result.prUrl}
            </a>
          </li>
        ) : null}
      </ul>
      {result.files && result.files.length > 0 ? (
        <details className="mt-3 text-xs">
          <summary className="cursor-pointer text-zinc-400">
            Files changed ({result.files.length})
          </summary>
          <ul className="mt-2 space-y-1 text-zinc-300">
            {result.files.map((f) => (
              <li key={f.path}>
                <code>{f.path}</code>{" "}
                <span className="text-zinc-500">({f.bytes} B)</span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
