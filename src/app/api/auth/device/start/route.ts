import { NextResponse } from "next/server";
import { getGithubClientId, GITHUB_OAUTH_SCOPE } from "@/lib/oauth";

export const dynamic = "force-dynamic";

interface DeviceCodeResponse {
  device_code?: string;
  user_code?: string;
  verification_uri?: string;
  verification_uri_complete?: string;
  expires_in?: number;
  interval?: number;
  error?: string;
  error_description?: string;
}

export async function POST() {
  const clientId = getGithubClientId();
  if (!clientId) {
    return NextResponse.json(
      { error: "Server is missing a GitHub OAuth client id." },
      { status: 500 },
    );
  }

  try {
    const resp = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        scope: GITHUB_OAUTH_SCOPE,
      }),
      cache: "no-store",
    });

    const data = (await resp.json()) as DeviceCodeResponse;

    if (!resp.ok || data.error || !data.device_code || !data.user_code) {
      return NextResponse.json(
        {
          error:
            data.error_description ||
            data.error ||
            "Failed to start GitHub device flow.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      deviceCode: data.device_code,
      userCode: data.user_code,
      verificationUri: data.verification_uri,
      verificationUriComplete:
        data.verification_uri_complete ||
        (data.verification_uri
          ? `${data.verification_uri}?user_code=${encodeURIComponent(
              data.user_code,
            )}`
          : undefined),
      expiresIn: data.expires_in,
      interval: data.interval,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    );
  }
}
