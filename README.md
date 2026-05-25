# gma codegen

An AI-powered code generator for your own GitHub repositories, powered by your
[CloseRouter](https://closerouter.dev/dashboard) API key.

The flow:

1. Open the site and sign in with GitHub.
2. Paste your CloseRouter API key (saved only in your browser's localStorage).
3. Click "Load models" to populate the model list from your CloseRouter
   account, then pick a model.
4. Pick one of your GitHub repos, write what you want built, and submit.
5. The server reads a listing of the repo (plus the contents of small text
   files), sends it to the model along with your prompt, parses the model's
   response into a set of full file contents, commits them to a new branch in
   your repo, and (by default) opens a pull request — your default branch is
   never touched.

The legacy Space Runner game is still bundled and is served at
[`/space-runner/`](./public/space-runner/index.html).

## Deploy

Easiest way (works from a phone): click the button.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fakelosk41-byte%2Fgma&project-name=gma-codegen&repository-name=gma-codegen&env=NEXTAUTH_SECRET,GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET&envDescription=See%20the%20README%20for%20how%20to%20generate%20NEXTAUTH_SECRET%20and%20create%20a%20GitHub%20OAuth%20App.&envLink=https%3A%2F%2Fgithub.com%2Fakelosk41-byte%2Fgma%23deploy-to-vercel-step-by-step)

The CloseRouter API key is **not** a Vercel env var — you paste it into the
app's settings page after deploy, and it's stored only in your browser's
`localStorage`.

### Deploy to Vercel — step by step

> The PR that introduces this app must be merged into the repo's default branch
> first, otherwise Vercel will deploy the previous default-branch contents
> instead of this app.

1. **Generate a secret.** On any device, paste this into a random-string
   generator like <https://generate-secret.vercel.app/32> or run
   `openssl rand -hex 32` somewhere. Save the output — that's your
   `NEXTAUTH_SECRET`.

2. **Click the Deploy button above.**
   - Sign in to Vercel with the same GitHub account that owns this repo.
   - Pick a project name, e.g. `gma-codegen`. Vercel will give you a URL like
     `gma-codegen-<hash>.vercel.app`.
   - For the env vars, paste:
     - `NEXTAUTH_SECRET` — the value you generated.
     - `GITHUB_CLIENT_ID` — leave as `placeholder` for now (you'll edit it
       after creating the GitHub OAuth app).
     - `GITHUB_CLIENT_SECRET` — leave as `placeholder` too.
   - Click **Deploy**. Wait for the build to finish.

3. **Copy your Vercel URL** (e.g. `https://gma-codegen-xyz.vercel.app`).

4. **Create a GitHub OAuth App.** Open
   <https://github.com/settings/applications/new> and fill in:
   - **Application name:** `gma codegen`
   - **Homepage URL:** your Vercel URL.
   - **Authorization callback URL:** your Vercel URL + `/api/auth/callback/github`
     (e.g. `https://gma-codegen-xyz.vercel.app/api/auth/callback/github`).
   - Click **Register application**, then **Generate a new client secret**.

5. **Plug the real GitHub creds into Vercel.** In your Vercel project →
   **Settings → Environment Variables**, edit:
   - `GITHUB_CLIENT_ID` — Client ID from the OAuth app.
   - `GITHUB_CLIENT_SECRET` — the secret you just generated.
   Then go to **Deployments → ⋯ → Redeploy** the latest deployment.

6. **Open your Vercel URL** and sign in with GitHub. On the dashboard,
   paste your CloseRouter API key from
   <https://closerouter.dev/dashboard>. Pick a repo and a model and try a
   prompt.

### Run locally instead

```bash
npm install
cp .env.example .env.local
# fill in GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, NEXTAUTH_SECRET
npm run dev
```

Then open <http://localhost:3000>. For the GitHub OAuth App, use:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- NextAuth (GitHub OAuth) — `repo` scope, so the app can read and write to
  your private and public repos
- `@octokit/rest` for the GitHub REST API
- Direct `fetch` against the CloseRouter OpenAI-compatible API

## How the codegen works

For each build:

1. The server fetches the default-branch tree of the chosen repo via the
   GitHub API and lists up to 400 files.
2. Up to 20 small (~4 KB) text files are inlined into the prompt so the
   model has actual code context.
3. The model is asked to reply with a single JSON object of the form
   `{ "summary": "...", "files": [{ "path": "...", "content": "..." }] }`.
4. The server parses the JSON (tolerant of code fences), creates one blob
   per file via the GitHub Git Data API, builds a new tree on top of the
   default branch's tree, creates a commit, creates a new branch ref, and
   opens a pull request.

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run start` — start production server
- `npm run lint` — Next.js lint
- `npm run typecheck` — `tsc --noEmit`
