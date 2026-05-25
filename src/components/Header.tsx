"use client";

import Link from "next/link";

export default function Header() {
  return (
    <header className="border-b border-border bg-panel/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link
          href="/"
          className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-xl font-bold text-transparent"
        >
          gma codegen
        </Link>
        <a
          href="https://github.com/akelosk41-byte/gma"
          target="_blank"
          rel="noreferrer"
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          Source on GitHub
        </a>
      </div>
    </header>
  );
}
