import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DevicePollRequestBody {
  clientId?: string;
  deviceCode?: string;
}

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

export async function POST(req: Request) {
  let body: DevicePollRequestBody;
  try {
    body = (await req.json()) as DevicePollRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const clientId = body.clientId?.trim();
  const deviceCode = body.deviceCode?.trim();
  if (!clientId || !deviceCode) {
    return NextResponse.json(
      { error: "clientId and deviceCode are required" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        device_code: deviceCode,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      }),
      cache: "no-store",
    });
    const data = (await res.json()) as TokenResponse;

    if (data.access_token) {
      let login: string | undefined;
      try {
        const u = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            Accept: "application/vnd.github+json",
          },
          cache: "no-store",
        });
        if (u.ok) {
          const ujson = (await u.json()) as { login?: string };
          login = ujson.login;
        }
      } catch {
        // user-lookup is best-effort
      }
      return NextResponse.json({
        status: "success",
        accessToken: data.access_token,
        scope: data.scope,
        login,
      });
    }

    if (data.error === "authorization_pending") {
      return NextResponse.json({ status: "pending" });
    }
    if (data.error === "slow_down") {
      return NextResponse.json({ status: "slow_down" });
    }
    if (data.error === "expired_token") {
      return NextResponse.json(
        { status: "expired", error: "Device code expired. Try again." },
        { status: 410 },
      );
    }
    if (data.error === "access_denied") {
      return NextResponse.json(
        { status: "denied", error: "Authorization was denied." },
        { status: 403 },
      );
    }
    return NextResponse.json(
      {
        status: "error",
        error: data.error_description || data.error || "Unknown GitHub error",
      },
      { status: 502 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 },
    );
  }
}
