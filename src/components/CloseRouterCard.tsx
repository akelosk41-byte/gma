"use client";

import { useEffect, useState } from "react";
import type { CloseRouterModel } from "@/lib/closerouter";
import {
  loadApiKey,
  loadBaseUrl,
  loadSelectedModel,
  saveApiKey,
  saveBaseUrl,
  saveSelectedModel,
} from "@/lib/settings";

export default function CloseRouterCard({
  onReady,
}: {
  onReady?: (apiKey: string, baseUrl: string, model: string) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [show, setShow] = useState(false);
  const [models, setModels] = useState<CloseRouterModel[]>([]);
  const [model, setModel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<number | null>(null);

  const check = async (k: string, b: string, preferModel: string) => {
    setError(null);
    setLoading(true);
    setModels([]);
    try {
      if (!k.trim()) throw new Error("Enter your CloseRouter API key first.");
      const res = await fetch("/api/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: k.trim(), baseUrl: b.trim() }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || `Request failed: ${res.status}`);
      const list = (data.models as CloseRouterModel[]) ?? [];
      setModels(list);
      const def =
        preferModel && list.some((m) => m.id === preferModel)
          ? preferModel
          : list[0]?.id || "";
      setModel(def);
      saveApiKey(k.trim());
      saveBaseUrl(b.trim());
      saveSelectedModel(def);
      setCheckedAt(Date.now());
      onReady?.(k.trim(), b.trim(), def);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const k = loadApiKey();
    const b = loadBaseUrl();
    const m = loadSelectedModel();
    setApiKey(k);
    setBaseUrl(b);
    setModel(m);
    if (k) {
      void check(k, b, m);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeModel = (id: string) => {
    setModel(id);
    saveSelectedModel(id);
  };

  return (
    <section className="rounded-2xl border border-border bg-panel p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Step 1 — CloseRouter API key</h2>
        {checkedAt ? (
          <span className="shrink-0 text-xs text-emerald-300">
            ✓ {models.length} models available
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-sm text-zinc-400">
        Paste your{" "}
        <a
          href="https://closerouter.dev/dashboard"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          CloseRouter API key
        </a>{" "}
        and click <strong>Check models</strong>. The key is stored only in this
        browser&apos;s localStorage.
      </p>

      <div className="mt-4 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">CloseRouter API key</span>
          <div className="flex gap-2">
            <input
              type={show ? "text" : "password"}
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-…"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="shrink-0 rounded-lg border border-border px-3"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <details className="text-xs text-zinc-400">
          <summary className="cursor-pointer">
            Advanced: custom base URL
          </summary>
          <label className="mt-2 block text-sm">
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.closerouter.dev/v1"
            />
          </label>
        </details>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void check(apiKey, baseUrl, model)}
            disabled={loading || !apiKey.trim()}
            className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading
              ? "Checking…"
              : checkedAt
                ? "Re-check models"
                : "Check models"}
          </button>
          {checkedAt ? (
            <span className="text-xs text-zinc-500">
              Last checked {new Date(checkedAt).toLocaleTimeString()}
            </span>
          ) : null}
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        {models.length > 0 ? (
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">
              Default model ({models.length} available)
            </span>
            <select
              value={model}
              onChange={(e) => onChangeModel(e.target.value)}
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                  {m.owned_by ? ` — ${m.owned_by}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
    </section>
  );
}
