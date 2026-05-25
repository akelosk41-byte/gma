import { NextResponse } from "next/server";
import { getGithubClientId } from "@/lib/oauth";

export const dynamic = "force-dynamic";

interface PollBody {
  deviceCode?: string;
}

interface TokenResponse {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
  interval?: number;
}

const PENDING_ERRORS = new Set(["authorization_pending", "slow_down"]);

export async function POST(req: Request) {
  let body: PollBody;
  try {
    body = (await req.json()) as PollBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const deviceCode = body.deviceCode?.trim();
  if (!deviceCode) {
    return NextResponse.json(
      { error: "deviceCode is required" },
      { status: 400 },
    );
  }

  const clientId = getGithubClientId();
  if (!clientId) {
    return NextResponse.json(
      { error: "Server is missing a GitHub OAuth client id." },
      { status: 500 },
    );
  }

  try {
    const resp = await fetch("https://github.com/login/oauth/access_token", {
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

    const data = (await resp.json()) as TokenResponse;

    if (data.access_token) {
      let login = "";
      try {
        const u = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            Accept: "application/vnd.github+json",
          },
          cache: "no-store",
        });
        if (u.ok) {
          const j = (await u.json()) as { login?: string };
          login = j.login || "";
        }
      } catch {
        // best-effort
      }
      return NextResponse.json({
        status: "authorized",
        accessToken: data.access_token,
        login,
      });
    }

    if (data.error && PENDING_ERRORS.has(data.error)) {
      return NextResponse.json({
        status: "pending",
        slowDown: data.error === "slow_down",
        interval: data.interval,
      });
    }

    return NextResponse.json(
      {
        status: "error",
        error:
          data.error_description ||
          data.error ||
          "Device flow token exchange failed.",
      },
      { status: 400 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        status: "error",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
