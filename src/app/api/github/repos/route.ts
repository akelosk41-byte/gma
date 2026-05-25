import { NextResponse } from "next/server";
import { listUserRepos } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { githubToken?: string };
  try {
    body = (await req.json()) as { githubToken?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.githubToken || typeof body.githubToken !== "string") {
    return NextResponse.json(
      { error: "githubToken is required" },
      { status: 400 },
    );
  }
  try {
    const repos = await listUserRepos(body.githubToken);
    return NextResponse.json({ repos });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 },
    );
  }
}
