import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

interface StartBody {
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
  scope?: string;
}

export async function POST(req: Request) {
  let body: StartBody;
  try {
    body = (await req.json()) as StartBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const clientId = body.clientId?.trim();
  const clientSecret = body.clientSecret?.trim();
  const redirectUri = body.redirectUri?.trim();
  const scope = (body.scope || "repo").trim();

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "clientId and clientSecret are required" },
      { status: 400 },
    );
  }
  if (!redirectUri) {
    return NextResponse.json(
      { error: "redirectUri is required" },
      { status: 400 },
    );
  }
  try {
    new URL(redirectUri);
  } catch {
    return NextResponse.json(
      { error: "redirectUri must be a valid absolute URL" },
      { status: 400 },
    );
  }

  const state = randomBytes(16).toString("hex");
  const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("allow_signup", "true");

  const res = NextResponse.json({ authorizeUrl: authorizeUrl.toString() });
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
  res.cookies.set("gma_oauth_state", state, cookieOpts);
  res.cookies.set("gma_oauth_client_id", clientId, cookieOpts);
  res.cookies.set("gma_oauth_client_secret", clientSecret, cookieOpts);
  res.cookies.set("gma_oauth_redirect_uri", redirectUri, cookieOpts);
  return res;
}
