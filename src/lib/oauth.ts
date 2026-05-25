// GitHub OAuth App configuration for the device-flow login.
//
// The Client ID below is the public identifier of the OAuth App that
// powers "Sign in with GitHub" inside gma codegen. It is intentionally
// hard-coded so the deployed app works out of the box with zero
// per-user setup — no forms, no env vars, no client secret. A Client
// ID is not a secret: it is included in every OAuth `authorize` URL.
//
// If you fork this project and want to use your own OAuth App, either
// edit this constant or set the `GITHUB_OAUTH_CLIENT_ID` environment
// variable on your deployment (e.g. in Vercel).
const DEFAULT_GITHUB_CLIENT_ID = "Ov23liTSZrS3Wi9LMUsg";

export function getGithubClientId(): string {
  return (process.env.GITHUB_OAUTH_CLIENT_ID || DEFAULT_GITHUB_CLIENT_ID).trim();
}

export const GITHUB_OAUTH_SCOPE = "repo";
