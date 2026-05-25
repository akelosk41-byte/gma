import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  const jar = cookies();
  const expectedState = jar.get("gma_oauth_state")?.value;
  const clientId = jar.get("gma_oauth_client_id")?.value;
  const clientSecret = jar.get("gma_oauth_client_secret")?.value;
  const redirectUri = jar.get("gma_oauth_redirect_uri")?.value;

  if (errorParam) {
    return clear(
      renderError(errorDescription || errorParam, "GitHub returned an error"),
    );
  }
  if (!code || !state) {
    return clear(renderError("Missing code or state from GitHub callback."));
  }
  if (!expectedState || state !== expectedState) {
    return clear(renderError("OAuth state mismatch. Try signing in again."));
  }
  if (!clientId || !clientSecret || !redirectUri) {
    return clear(
      renderError("OAuth session expired. Click 'Sign in with GitHub' again."),
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
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
      cache: "no-store",
    });
    const data = (await resp.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };
    if (!data.access_token) {
      return clear(
        renderError(
          data.error_description || data.error || "Token exchange failed.",
        ),
      );
    }
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
    return clear(renderSuccess(data.access_token, login));
  } catch (err) {
    return clear(
      renderError(err instanceof Error ? err.message : "Unknown error"),
    );
  }
}

function renderSuccess(token: string, login: string): NextResponse {
  const tokenJs = JSON.stringify(token);
  const loginJs = JSON.stringify(login);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Signed in — gma codegen</title>
<style>
  body { background: #0a0a0a; color: #e4e4e7; font: 14px system-ui; padding: 2rem; }
  .card { max-width: 480px; margin: 4rem auto; padding: 2rem; border: 1px solid #27272a; border-radius: 12px; background: #18181b; }
</style>
</head>
<body>
<div class="card">
<h2>Signed in</h2>
<p>Saving your token and redirecting back to the app…</p>
<p><a href="/">Click here if you are not redirected.</a></p>
</div>
<script>
try {
  localStorage.setItem("gma.github.token", ${tokenJs});
  localStorage.setItem("gma.github.user", ${loginJs});
} catch (e) {}
location.replace("/");
</script>
</body>
</html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function renderError(detail: string, title = "OAuth error"): NextResponse {
  const safe = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${safe(title)} — gma codegen</title>
<style>
  body { background: #0a0a0a; color: #e4e4e7; font: 14px system-ui; padding: 2rem; }
  .card { max-width: 480px; margin: 4rem auto; padding: 2rem; border: 1px solid #7f1d1d; border-radius: 12px; background: #18181b; }
  a { color: #60a5fa; }
</style>
</head>
<body>
<div class="card">
<h2>${safe(title)}</h2>
<p>${safe(detail)}</p>
<p><a href="/">Back to gma codegen</a></p>
</div>
</body>
</html>`;
  return new NextResponse(html, {
    status: 400,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function clear(res: NextResponse): NextResponse {
  for (const name of [
    "gma_oauth_state",
    "gma_oauth_client_id",
    "gma_oauth_client_secret",
    "gma_oauth_redirect_uri",
  ]) {
    res.cookies.set(name, "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
  return res;
}
