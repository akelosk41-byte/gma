"use client";

import { useEffect, useState } from "react";
import {
  loadGithubClientId,
  loadGithubClientSecret,
  loadGithubToken,
  loadGithubUser,
  saveGithubClientId,
  saveGithubClientSecret,
  saveGithubToken,
  saveGithubUser,
} from "@/lib/settings";

export default function GithubAuthCard({
  ready,
}: {
  ready: boolean;
}) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [token, setToken] = useState("");
  const [login, setLogin] = useState("");
  const [showId, setShowId] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("");
  const [callbackCopied, setCallbackCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClientId(loadGithubClientId());
    setClientSecret(loadGithubClientSecret());
    setToken(loadGithubToken());
    setLogin(loadGithubUser());
    if (typeof window !== "undefined") {
      setCallbackUrl(window.location.origin + "/api/auth/callback");
    }
  }, []);

  const copyCallback = async () => {
    try {
      await navigator.clipboard.writeText(callbackUrl);
      setCallbackCopied(true);
      window.setTimeout(() => setCallbackCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const signIn = async () => {
    setError(null);
    setSubmitting(true);
    const cid = clientId.trim();
    const cs = clientSecret.trim();
    if (!cid || !cs) {
      setError("Enter both Client ID and Client Secret.");
      setSubmitting(false);
      return;
    }
    saveGithubClientId(cid);
    saveGithubClientSecret(cs);
    try {
      const res = await fetch("/api/auth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: cid,
          clientSecret: cs,
          redirectUri: callbackUrl,
          scope: "repo",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.authorizeUrl) {
        throw new Error(data?.error || "Failed to start OAuth.");
      }
      window.location.href = data.authorizeUrl as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubmitting(false);
    }
  };

  const signOut = () => {
    saveGithubToken("");
    saveGithubUser("");
    setToken("");
    setLogin("");
  };

  const oauthAppNewUrl =
    callbackUrl &&
    `https://github.com/settings/applications/new?` +
      new URLSearchParams({
        "oauth_application[name]": "gma-codegen",
        "oauth_application[url]": callbackUrl.replace(
          "/api/auth/callback",
          "",
        ),
        "oauth_application[callback_url]": callbackUrl,
      }).toString();

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
          Standard GitHub OAuth — you&apos;ll be redirected to github.com to
          authorize, then back here.
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
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-border bg-black/30 p-3 text-sm">
            <p className="text-zinc-300">
              <strong>One-time GitHub setup.</strong> Open{" "}
              {oauthAppNewUrl ? (
                <a
                  href={oauthAppNewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  github.com/settings/applications/new
                </a>
              ) : (
                <code>github.com/settings/applications/new</code>
              )}{" "}
              and create an OAuth App with these settings:
            </p>
            <ul className="mt-2 space-y-1 text-xs text-zinc-400">
              <li>
                <strong>Application name:</strong> anything (e.g.{" "}
                <code>gma-codegen</code>)
              </li>
              <li>
                <strong>Homepage URL:</strong>{" "}
                <code className="break-all">
                  {callbackUrl
                    ? callbackUrl.replace("/api/auth/callback", "")
                    : "your deployed URL"}
                </code>
              </li>
              <li className="flex flex-wrap items-center gap-2">
                <span>
                  <strong>Authorization callback URL:</strong>{" "}
                </span>
                <code className="break-all rounded bg-black/50 px-2 py-0.5">
                  {callbackUrl || "/api/auth/callback"}
                </code>
                <button
                  type="button"
                  onClick={copyCallback}
                  disabled={!callbackUrl}
                  className="rounded-md border border-border px-2 py-0.5 text-xs hover:border-accent disabled:opacity-50"
                >
                  {callbackCopied ? "Copied!" : "Copy"}
                </button>
              </li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              After registering, click <em>Generate a new client secret</em>{" "}
              and paste both values below.
            </p>
          </div>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Client ID</span>
            <div className="flex gap-2">
              <input
                type={showId ? "text" : "password"}
                autoComplete="off"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Ov23li... or Iv1...."
                disabled={!ready}
              />
              <button
                type="button"
                onClick={() => setShowId((s) => !s)}
                className="shrink-0 rounded-lg border border-border px-3"
              >
                {showId ? "Hide" : "Show"}
              </button>
            </div>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-zinc-300">Client Secret</span>
            <div className="flex gap-2">
              <input
                type={showSecret ? "text" : "password"}
                autoComplete="off"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="github_pat-style 40-char secret"
                disabled={!ready}
              />
              <button
                type="button"
                onClick={() => setShowSecret((s) => !s)}
                className="shrink-0 rounded-lg border border-border px-3"
              >
                {showSecret ? "Hide" : "Show"}
              </button>
            </div>
            <span className="mt-1 block text-xs text-zinc-500">
              Stored only in this browser&apos;s localStorage. It is sent to
              this app&apos;s own backend during sign-in so it can complete
              the OAuth code exchange with GitHub.
            </span>
          </label>

          <button
            type="button"
            onClick={() => void signIn()}
            disabled={
              !ready || !clientId.trim() || !clientSecret.trim() || submitting
            }
            className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Redirecting…" : "Sign in with GitHub"}
          </button>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>
      )}
    </section>
  );
}
