import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface DeviceCodeRequestBody {
  clientId?: string;
  scope?: string;
}

interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export async function POST(req: Request) {
  let body: DeviceCodeRequestBody;
  try {
    body = (await req.json()) as DeviceCodeRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const clientId = body.clientId?.trim();
  if (!clientId) {
    return NextResponse.json(
      { error: "clientId is required" },
      { status: 400 },
    );
  }
  const scope = body.scope?.trim() || "repo";

  try {
    const res = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ client_id: clientId, scope }),
      cache: "no-store",
    });
    const data = (await res.json()) as Partial<DeviceCodeResponse> & {
      error?: string;
      error_description?: string;
    };
    if (!res.ok || !data.device_code) {
      return NextResponse.json(
        {
          error:
            data.error_description ||
            data.error ||
            `GitHub returned ${res.status} ${res.statusText}`,
        },
        { status: 502 },
      );
    }
    return NextResponse.json({
      deviceCode: data.device_code,
      userCode: data.user_code,
      verificationUri: data.verification_uri,
      expiresIn: data.expires_in,
      interval: data.interval ?? 5,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 502 },
    );
  }
}
