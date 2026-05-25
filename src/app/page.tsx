"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-2xl border border-border bg-panel p-8 shadow-xl">
        <h1 className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-4xl font-bold text-transparent">
          gma codegen
        </h1>
        <p className="mt-3 text-lg text-zinc-300">
          AI-powered code generator for your GitHub repos, powered by your
          CloseRouter API key.
        </p>

        <ol className="mt-6 space-y-3 text-zinc-300">
          <li>
            <span className="mr-2 inline-block w-6 text-center font-bold text-accent">
              1.
            </span>
            Sign in with GitHub.
          </li>
          <li>
            <span className="mr-2 inline-block w-6 text-center font-bold text-accent">
              2.
            </span>
            Paste your CloseRouter API key — saved only in your browser.
          </li>
          <li>
            <span className="mr-2 inline-block w-6 text-center font-bold text-accent">
              3.
            </span>
            Pick a repo + a model, write what you want built, and submit.
          </li>
          <li>
            <span className="mr-2 inline-block w-6 text-center font-bold text-accent">
              4.
            </span>
            The AI generates the changes, commits them to a new branch and
            opens a PR in your repo.
          </li>
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          {authed ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:opacity-90"
            >
              Open dashboard
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
              className="rounded-lg bg-accent px-5 py-2.5 font-medium text-white hover:opacity-90"
            >
              Sign in with GitHub
            </button>
          )}
          <a
            href="https://closerouter.dev/dashboard"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border bg-panel px-5 py-2.5 font-medium text-zinc-200 hover:border-accent"
          >
            Get a CloseRouter API key
          </a>
        </div>

        {session?.user?.name ? (
          <p className="mt-6 text-sm text-zinc-400">
            Signed in as {session.user.name}
            {session.githubLogin ? ` (@${session.githubLogin})` : null}
          </p>
        ) : null}
      </div>
    </main>
  );
}
