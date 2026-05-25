import { NextResponse } from "next/server";
import { listModels } from "@/lib/closerouter";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { apiKey?: string; baseUrl?: string };
  try {
    body = (await req.json()) as { apiKey?: string; baseUrl?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.apiKey || typeof body.apiKey !== "string") {
    return NextResponse.json(
      { error: "apiKey is required" },
      { status: 400 },
    );
  }
  try {
    const models = await listModels({
      apiKey: body.apiKey,
      baseUrl: body.baseUrl,
    });
    return NextResponse.json({ models });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 },
    );
  }
}
