"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadGithubClientId,
  loadGithubToken,
  loadGithubUser,
  saveGithubClientId,
  saveGithubToken,
  saveGithubUser,
} from "@/lib/settings";

interface DeviceCode {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export default function GithubAuthCard({
  ready,
  onAuthed,
}: {
  ready: boolean;
  onAuthed?: (token: string, login: string | null) => void;
}) {
  const [clientId, setClientId] = useState("");
  const [token, setToken] = useState("");
  const [login, setLogin] = useState("");
  const [showClient, setShowClient] = useState(false);
  const [device, setDevice] = useState<DeviceCode | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const pollTimer = useRef<number | null>(null);

  useEffect(() => {
    setClientId(loadGithubClientId());
    setToken(loadGithubToken());
    setLogin(loadGithubUser());
    return () => {
      if (pollTimer.current) window.clearTimeout(pollTimer.current);
    };
  }, []);

  const cancel = useCallback(() => {
    if (pollTimer.current) window.clearTimeout(pollTimer.current);
    pollTimer.current = null;
    setDevice(null);
    setPolling(false);
    setError(null);
    setStartedAt(null);
  }, []);

  const poll = useCallback(
    async (cid: string, dc: DeviceCode, interval: number) => {
      try {
        const res = await fetch("/api/github/device-poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: cid, deviceCode: dc.deviceCode }),
        });
        const data = await res.json();
        if (data.status === "success") {
          setPolling(false);
          const t = data.accessToken as string;
          const l = (data.login as string | undefined) || "";
          saveGithubToken(t);
          saveGithubUser(l);
          setToken(t);
          setLogin(l);
          setDevice(null);
          setError(null);
          onAuthed?.(t, l || null);
          return;
        }
        if (data.status === "pending") {
          pollTimer.current = window.setTimeout(
            () => void poll(cid, dc, interval),
            interval * 1000,
          );
          return;
        }
        if (data.status === "slow_down") {
          pollTimer.current = window.setTimeout(
            () => void poll(cid, dc, interval + 5),
            (interval + 5) * 1000,
          );
          return;
        }
        setPolling(false);
        setDevice(null);
        setError(data.error || "GitHub auth failed.");
      } catch (err) {
        setPolling(false);
        setDevice(null);
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    },
    [onAuthed],
  );

  const sign = async () => {
    setError(null);
    cancel();
    const cid = clientId.trim();
    if (!cid) {
      setError("Enter your GitHub OAuth App Client ID first.");
      return;
    }
    saveGithubClientId(cid);
    try {
      const res = await fetch("/api/github/device-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: cid, scope: "repo" }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || "Failed to start device flow.");
      const dc: DeviceCode = {
        deviceCode: data.deviceCode,
        userCode: data.userCode,
        verificationUri: data.verificationUri,
        expiresIn: data.expiresIn,
        interval: data.interval,
      };
      setDevice(dc);
      setPolling(true);
      setStartedAt(Date.now());
      pollTimer.current = window.setTimeout(
        () => void poll(cid, dc, dc.interval),
        dc.interval * 1000,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const signOut = () => {
    saveGithubToken("");
    saveGithubUser("");
    setToken("");
    setLogin("");
  };

  return (
    <section
      className={`rounded-2xl border border-border bg-panel p-6 ${
        ready ? "" : "opacity-60"
      }`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">Step 2 — Sign in with GitHub</h2>
        {token ? (
          <span className="shrink-0 text-xs text-emerald-300">
            ✓ Signed in{login ? ` as @${login}` : ""}
          </span>
        ) : null}
      </div>
      {!ready ? (
        <p className="mt-1 text-sm text-zinc-400">Complete Step 1 first.</p>
      ) : (
        <p className="mt-1 text-sm text-zinc-400">
          Uses{" "}
          <a
            href="https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            GitHub OAuth Device Flow
          </a>
          : no callback URL, no secret. Paste your OAuth App Client ID, click
          sign in, then enter an 8-character code on github.com.
        </p>
      )}

      {token ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={signOut}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:border-accent"
          >
            Sign out
          </button>
          <span className="text-xs text-zinc-500">
            Token stored only in this browser&apos;s localStorage.
          </span>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">
              GitHub OAuth App Client ID{" "}
              <a
                href="https://github.com/settings/applications/new"
                target="_blank"
                rel="noreferrer"
                className="text-xs underline"
              >
                create one →
              </a>
            </span>
            <div className="flex gap-2">
              <input
                type={showClient ? "text" : "password"}
                autoComplete="off"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Iv1.xxxxxxxxxxxxxxxx (no secret needed)"
                disabled={!ready}
              />
              <button
                type="button"
                onClick={() => setShowClient((s) => !s)}
                className="shrink-0 rounded-lg border border-border px-3"
              >
                {showClient ? "Hide" : "Show"}
              </button>
            </div>
            <span className="mt-1 block text-xs text-zinc-500">
              When you create the OAuth App: any Homepage URL is fine (e.g.
              your Vercel URL), use the same value for the &quot;Authorization
              callback URL&quot; field, and{" "}
              <strong>enable the &quot;Device Flow&quot; checkbox</strong>.
              You only need the <em>Client ID</em> — no secret.
            </span>
          </label>
          {device ? (
            <DeviceCodeBlock
              device={device}
              startedAt={startedAt}
              polling={polling}
              onCancel={cancel}
            />
          ) : (
            <button
              type="button"
              onClick={() => void sign()}
              disabled={!ready || !clientId.trim()}
              className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Sign in with GitHub
            </button>
          )}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>
      )}
    </section>
  );
}

function DeviceCodeBlock({
  device,
  startedAt,
  polling,
  onCancel,
}: {
  device: DeviceCode;
  startedAt: number | null;
  polling: boolean;
  onCancel: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const elapsed = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  const remaining = Math.max(0, device.expiresIn - elapsed);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(device.userCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  // tick keeps the countdown updating
  void tick;
  return (
    <div className="rounded-lg border border-accent/40 bg-accent/5 p-4">
      <p className="text-sm text-zinc-200">
        Open{" "}
        <a
          href={device.verificationUri}
          target="_blank"
          rel="noreferrer"
          className="font-semibold underline"
        >
          {device.verificationUri}
        </a>{" "}
        on any device and enter this code:
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <code className="rounded-lg bg-black/40 px-4 py-2 text-2xl font-bold tracking-widest text-accent">
          {device.userCode}
        </code>
        <button
          type="button"
          onClick={copy}
          className="rounded-lg border border-border px-3 py-2 text-sm hover:border-accent"
        >
          {copied ? "Copied!" : "Copy code"}
        </button>
        <a
          href={device.verificationUri}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Open GitHub →
        </a>
      </div>
      <p className="mt-3 text-xs text-zinc-400">
        {polling
          ? "Waiting for you to authorize on github.com…"
          : "Polling stopped."}{" "}
        Code expires in ~{remaining}s.
      </p>
      <button
        type="button"
        onClick={onCancel}
        className="mt-2 text-xs text-zinc-500 underline"
      >
        Cancel
      </button>
    </div>
  );
}
