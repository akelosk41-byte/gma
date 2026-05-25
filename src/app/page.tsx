"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import CloseRouterCard from "@/components/CloseRouterCard";
import GithubAuthCard from "@/components/GithubAuthCard";
import RepoPicker from "@/components/RepoPicker";
import { loadApiKey, loadGithubToken } from "@/lib/settings";

export default function HomePage() {
  const [step1Done, setStep1Done] = useState(false);
  const [step2Done, setStep2Done] = useState(false);

  useEffect(() => {
    setStep1Done(!!loadApiKey());
    setStep2Done(!!loadGithubToken());
  }, []);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-2xl border border-border bg-panel p-6">
          <h1 className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-3xl font-bold text-transparent">
            gma codegen
          </h1>
          <p className="mt-2 text-zinc-300">
            AI code generator for your GitHub repos. Three quick steps:
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-zinc-300">
            <li>Enter your CloseRouter API key and load available models.</li>
            <li>Sign in with GitHub — one click, no setup.</li>
            <li>
              Pick a repo, write what you want built — the AI commits the
              changes to a new branch and opens a PR.
            </li>
          </ol>
        </section>

        <CloseRouterCard onReady={() => setStep1Done(true)} />
        <GithubAuthCard ready={step1Done} />
        {step2Done ? (
          <RepoPicker />
        ) : (
          <section className="rounded-2xl border border-border bg-panel p-6 opacity-60">
            <h2 className="text-lg font-semibold">
              Step 3 — Your repositories
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Sign in with GitHub above to load your repos.
            </p>
          </section>
        )}
      </main>
    </>
  );
}
