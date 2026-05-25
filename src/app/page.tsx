"use client";

import Header from "@/components/Header";
import SettingsCard from "@/components/SettingsCard";
import RepoPicker from "@/components/RepoPicker";

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <section className="rounded-2xl border border-border bg-panel p-6">
          <h1 className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-3xl font-bold text-transparent">
            gma codegen
          </h1>
          <p className="mt-2 text-zinc-300">
            AI code generator for your GitHub repos. Paste two tokens below,
            pick a repo + a model, write what you want — the AI commits the
            changes to a new branch in your repo and opens a PR.
          </p>
        </section>

        <SettingsCard />
        <RepoPicker />
      </main>
    </>
  );
}
