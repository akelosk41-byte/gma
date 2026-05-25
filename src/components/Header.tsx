"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const { data: session } = useSession();
  return (
    <header className="border-b border-border bg-panel/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link
          href="/dashboard"
          className="bg-gradient-to-r from-accent to-accent2 bg-clip-text text-xl font-bold text-transparent"
        >
          gma codegen
        </Link>
        <div className="flex items-center gap-3 text-sm">
          {session?.user?.name ? (
            <span className="text-zinc-400">
              {session.user.name}
              {session.githubLogin ? ` (@${session.githubLogin})` : null}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-lg border border-border px-3 py-1.5 text-zinc-200 hover:border-accent"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
