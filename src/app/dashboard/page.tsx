"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Header from "@/components/Header";
import SettingsCard from "@/components/SettingsCard";
import RepoPicker from "@/components/RepoPicker";

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
    }
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-zinc-400">
        Loading session…
      </main>
    );
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <SettingsCard />
        <RepoPicker />
      </main>
    </>
  );
}
