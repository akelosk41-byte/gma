"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadGithubToken,
  loadGithubUser,
  saveGithubToken,
  saveGithubUser,
} from "@/lib/settings";

type Phase = "idle" | "starting" | "waiting" | "success" | "error";

interface DeviceStart {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  verificationUriComplete?: string;
  expiresIn: number;
  interval: number;
}

export default function GithubAuthCard({ ready }: { ready: boolean }) {
  const [token, setToken] = useState("");
  const [login, setLogin] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<DeviceStart | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const pollTimerRef = useRef<number | null>(null);
  const expiryTimerRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    setToken(loadGithubToken());
    setLogin(loadGithubUser());
  }, []);

  const clearTimers = useCallback(() => {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (expiryTimerRef.current) {
      window.clearInterval(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      clearTimers();
    };
  }, [clearTimers]);

  const cancel = useCallback(() => {
    stoppedRef.current = true;
    clearTimers();
    setDevice(null);
    setPhase("idle");
    setError(null);
  }, [clearTimers]);

  const finishWithToken = useCallback(
    (accessToken: string, userLogin: string) => {
      saveGithubToken(accessToken);
      saveGithubUser(userLogin);
      setToken(accessToken);
      setLogin(userLogin);
      setPhase("success");
      clearTimers();
    },
    [clearTimers],
  );

  const poll = useCallback(
    async (deviceCode: string, intervalMs: number) => {
      if (stoppedRef.current) return;
      try {
        const res = await fetch("/api/auth/device/poll", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceCode }),
        });
        const data = (await res.json()) as {
          status?: "authorized" | "pending" | "error";
          accessToken?: string;
          login?: string;
          slowDown?: boolean;
          interval?: number;
          error?: string;
        };
        if (stoppedRef.current) return;
        if (data.status === "authorized" && data.accessToken) {
          finishWithToken(data.accessToken, data.login || "");
          return;
        }
        if (data.status === "pending") {
          const next = data.slowDown
            ? Math.max(intervalMs + 5000, (data.interval ?? 5) * 1000)
            : (data.interval ? data.interval * 1000 : intervalMs);
          pollTimerRef.current = window.setTimeout(
            () => void poll(deviceCode, next),
            next,
          );
          return;
        }
        setError(data.error || "GitHub rejected the device flow.");
        setPhase("error");
        clearTimers();
      } catch (err) {
        if (stoppedRef.current) return;
        setError(err instanceof Error ? err.message : "Network error");
        setPhase("error");
        clearTimers();
      }
    },
    [clearTimers, finishWithToken],
  );

  const startSignIn = useCallback(async () => {
    setError(null);
    setPhase("starting");
    setDevice(null);
    stoppedRef.current = false;
    try {
      const res = await fetch("/api/auth/device/start", { method: "POST" });
      const data = (await res.json()) as Partial<DeviceStart> & {
        error?: string;
      };
      if (
        !res.ok ||
        !data.deviceCode ||
        !data.userCode ||
        !data.verificationUri
      ) {
        throw new Error(data.error || "Failed to start GitHub sign-in.");
      }
      const start: DeviceStart = {
        deviceCode: data.deviceCode,
        userCode: data.userCode,
        verificationUri: data.verificationUri,
        verificationUriComplete: data.verificationUriComplete,
        expiresIn: data.expiresIn ?? 900,
        interval: data.interval ?? 5,
      };
      setDevice(start);
      setSecondsLeft(start.expiresIn);
      setPhase("waiting");

      const verifyUrl = start.verificationUriComplete || start.verificationUri;
      try {
        window.open(verifyUrl, "_blank", "noopener,noreferrer");
      } catch {
        // popup blocked — the modal still shows a button the user can click
      }

      expiryTimerRef.current = window.setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            stoppedRef.current = true;
            clearTimers();
            setPhase("error");
            setError("Sign-in timed out. Click 'Sign in with GitHub' again.");
            return 0;
          }
          return s - 1;
        });
      }, 1000);

      const intervalMs = start.interval * 1000;
      pollTimerRef.current = window.setTimeout(
        () => void poll(start.deviceCode, intervalMs),
        intervalMs,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setPhase("error");
    }
  }, [clearTimers, poll]);

  const signOut = () => {
    saveGithubToken("");
    saveGithubUser("");
    setToken("");
    setLogin("");
    setPhase("idle");
  };

  const copyCode = async () => {
    if (!device) return;
    try {
      await navigator.clipboard.writeText(device.userCode);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const isWaiting = phase === "waiting" || phase === "starting";

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
          One button. GitHub will open in a new tab — approve and you&apos;re
          done. No client id, no secret, no setup.
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
          <button
            type="button"
            onClick={() => void startSignIn()}
            disabled={!ready || isWaiting}
            className="rounded-lg bg-accent px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {phase === "starting"
              ? "Starting…"
              : phase === "waiting"
                ? "Waiting for GitHub…"
                : "Sign in with GitHub"}
          </button>
          {phase === "waiting" && device ? (
            <div className="rounded-lg border border-border bg-black/30 p-4 text-sm">
              <p className="text-zinc-300">
                GitHub opened in a new tab. If prompted, enter this code and
                click <em>Authorize</em>:
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <code className="rounded-md border border-border bg-black/60 px-3 py-1.5 text-lg font-mono tracking-widest">
                  {device.userCode}
                </code>
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:border-accent"
                >
                  {codeCopied ? "Copied!" : "Copy code"}
                </button>
                <a
                  href={
                    device.verificationUriComplete || device.verificationUri
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border px-2 py-1 text-xs hover:border-accent"
                >
                  Open GitHub again
                </a>
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:border-accent"
                >
                  Cancel
                </button>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Expires in {Math.floor(secondsLeft / 60)}:
                {(secondsLeft % 60).toString().padStart(2, "0")}. This page
                will switch automatically the moment you approve on GitHub.
              </p>
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
        </div>
      )}
    </section>
  );
}
