"use client";

import { useEffect, useState } from "react";
import {
  loadApiKey,
  loadBaseUrl,
  loadGithubToken,
  saveApiKey,
  saveBaseUrl,
  saveGithubToken,
} from "@/lib/settings";

export interface SettingsValue {
  apiKey: string;
  baseUrl: string;
  githubToken: string;
}

export default function SettingsCard({
  onChange,
}: {
  onChange?: (s: SettingsValue) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [githubToken, setGhToken] = useState("");
  const [showCr, setShowCr] = useState(false);
  const [showGh, setShowGh] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const k = loadApiKey();
    const b = loadBaseUrl();
    const g = loadGithubToken();
    setApiKey(k);
    setBaseUrl(b);
    setGhToken(g);
    onChange?.({ apiKey: k, baseUrl: b, githubToken: g });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    const k = apiKey.trim();
    const b = baseUrl.trim();
    const g = githubToken.trim();
    saveApiKey(k);
    saveBaseUrl(b);
    saveGithubToken(g);
    setSavedAt(Date.now());
    onChange?.({ apiKey: k, baseUrl: b, githubToken: g });
  };

  const handleClear = () => {
    saveApiKey("");
    saveBaseUrl("");
    saveGithubToken("");
    setApiKey("");
    setBaseUrl("");
    setGhToken("");
    setSavedAt(null);
    onChange?.({ apiKey: "", baseUrl: "", githubToken: "" });
  };

  return (
    <section className="rounded-2xl border border-border bg-panel p-6">
      <h2 className="text-lg font-semibold">Settings</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Both tokens are stored only in this browser&apos;s localStorage. They
        are sent to the server only when you click &quot;Load repos&quot;,
        &quot;Load models&quot;, or &quot;Build with AI&quot;.
      </p>

      <div className="mt-4 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">
            GitHub Personal Access Token{" "}
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=gma+codegen"
              target="_blank"
              rel="noreferrer"
              className="text-xs underline"
            >
              create one →
            </a>
          </span>
          <div className="flex gap-2">
            <input
              type={showGh ? "text" : "password"}
              autoComplete="off"
              value={githubToken}
              onChange={(e) => setGhToken(e.target.value)}
              placeholder="ghp_… or github_pat_…"
            />
            <button
              type="button"
              onClick={() => setShowGh((s) => !s)}
              className="shrink-0 rounded-lg border border-border px-3"
            >
              {showGh ? "Hide" : "Show"}
            </button>
          </div>
          <span className="mt-1 block text-xs text-zinc-500">
            Needs the <code>repo</code> scope (classic) — or a fine-grained
            token with Contents: Read&amp;Write and Pull requests:
            Read&amp;Write on the repos you want to use.
          </span>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">
            CloseRouter API key{" "}
            <a
              href="https://closerouter.dev/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-xs underline"
            >
              get one →
            </a>
          </span>
          <div className="flex gap-2">
            <input
              type={showCr ? "text" : "password"}
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-…"
            />
            <button
              type="button"
              onClick={() => setShowCr((s) => !s)}
              className="shrink-0 rounded-lg border border-border px-3"
            >
              {showCr ? "Hide" : "Show"}
            </button>
          </div>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">
            CloseRouter base URL (optional, defaults to{" "}
            <code>https://api.closerouter.dev/v1</code>)
          </span>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.closerouter.dev/v1"
          />
        </label>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:opacity-90"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-border px-4 py-2 text-zinc-200 hover:border-accent"
        >
          Clear
        </button>
        {savedAt ? (
          <span className="self-center text-xs text-zinc-500">
            Saved at {new Date(savedAt).toLocaleTimeString()}
          </span>
        ) : null}
      </div>
    </section>
  );
}
