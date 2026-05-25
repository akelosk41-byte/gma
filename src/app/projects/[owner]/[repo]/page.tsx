import Link from "next/link";
import Header from "@/components/Header";
import BuildPanel from "@/components/BuildPanel";

export default function ProjectPage({
  params,
}: {
  params: { owner: string; repo: string };
}) {
  const owner = decodeURIComponent(params.owner);
  const repo = decodeURIComponent(params.repo);

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl space-y-4 px-6 py-8">
        <nav className="text-sm">
          <Link href="/" className="text-zinc-400 hover:text-zinc-200">
            ← Back home
          </Link>
        </nav>
        <h1 className="text-2xl font-semibold">
          {owner}/{repo}
        </h1>
        <p className="text-sm text-zinc-400">
          View on GitHub:{" "}
          <a
            href={`https://github.com/${owner}/${repo}`}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            github.com/{owner}/{repo}
          </a>
        </p>
        <BuildPanel owner={owner} repo={repo} />
      </main>
    </>
  );
}
