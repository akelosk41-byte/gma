"use client";

import { useEffect, useState } from "react";
import { loadApiKey, loadBaseUrl, saveApiKey, saveBaseUrl } from "@/lib/settings";

export interface SettingsValue {
  apiKey: string;
  baseUrl: string;
}

export default function SettingsCard({
  onChange,
}: {
  onChange?: (s: SettingsValue) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [show, setShow] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    const k = loadApiKey();
    const b = loadBaseUrl();
    setApiKey(k);
    setBaseUrl(b);
    onChange?.({ apiKey: k, baseUrl: b });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    saveApiKey(apiKey.trim());
    saveBaseUrl(baseUrl.trim());
    setSavedAt(Date.now());
    onChange?.({ apiKey: apiKey.trim(), baseUrl: baseUrl.trim() });
  };

  const handleClear = () => {
    saveApiKey("");
    saveBaseUrl("");
    setApiKey("");
    setBaseUrl("");
    setSavedAt(null);
    onChange?.({ apiKey: "", baseUrl: "" });
  };

  return (
    <section className="rounded-2xl border border-border bg-panel p-6">
      <h2 className="text-lg font-semibold">CloseRouter settings</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Your API key is stored only in your browser&apos;s localStorage and is
        sent directly to CloseRouter from the server when you run a build.
      </p>

      <div className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">API key</span>
          <div className="flex gap-2">
            <input
              type={show ? "text" : "password"}
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
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

        <label className="block text-sm">
          <span className="mb-1 block text-zinc-300">
            Base URL (optional, defaults to https://api.closerouter.dev/v1)
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
