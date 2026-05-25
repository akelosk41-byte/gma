# gma codegen

An AI code generator for your GitHub repos, powered by your
[CloseRouter](https://closerouter.dev/dashboard) API key.

You enter your CloseRouter key, check available models, click *Sign in
with GitHub*, then pick a repo and write a prompt. The AI commits the
changes to a new branch in your repo and opens a pull request. Your
default branch is never touched.

There is no Client ID, Client Secret or callback URL to configure. The
first time you sign in, GitHub opens in a new tab, you click *Authorize*,
and the page swaps itself into the signed-in state automatically.

## Deploy in 3 steps (works from a phone)

> First merge the PR that introduces this app into the repo's default branch,
> so the Deploy button picks up the Next.js code instead of the old
> `index.html`.

1. **Click the button** — no env vars to set, just pick a project name
   (e.g. `gma-codegen`) and hit Deploy.

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fakelosk41-byte%2Fgma&project-name=gma-codegen&repository-name=gma-codegen)

2. **Open your Vercel URL** (something like
   `https://gma-codegen-xyz.vercel.app`).

3. **Walk through the 3 steps on the home page:**

   - **Step 1 — CloseRouter API key.** Paste your key from
     <https://closerouter.dev/dashboard>, click *Check models*. The app
     shows the list of available models and remembers your default pick.
   - **Step 2 — Sign in with GitHub.** Click *Sign in with GitHub*. A
     GitHub authorization page opens in a new tab — click *Authorize*
     and the gma page picks up the token automatically. No Client ID,
     no Client Secret, no callback URL. (Uses the GitHub OAuth Device
     Flow under the hood; the OAuth App's public Client ID is hard-coded
     in the source.)
   - **Step 3 — Your repositories.** Pick a repo, type what you want
     built, click *Build with AI*. You'll get a new branch and a PR link.

Only the resulting GitHub access token is stored in your browser's
`localStorage`. No Client ID/Secret ever leaves the deployed code, no
cookies are kept after the device-flow exchange, nothing is persisted on
Vercel.

### Using your own OAuth App

If you want to use your own OAuth App instead of the one baked into the
source, register an app at
<https://github.com/settings/applications/new>, **enable Device Flow** on
its settings page, then either edit `DEFAULT_GITHUB_CLIENT_ID` in
`src/lib/oauth.ts` or set the `GITHUB_OAUTH_CLIENT_ID` environment
variable on your Vercel project. No callback URL, no client secret.

## Run locally instead

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. No `.env` file is required. The
built-in OAuth App's Device Flow works the same locally as it does on
Vercel.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- `@octokit/rest` for the GitHub REST API
- Direct `fetch` against the CloseRouter OpenAI-compatible API
- GitHub OAuth Device Flow handled in two routes:
  - `POST /api/auth/device/start` — asks GitHub for a device code and
    user code using the hard-coded Client ID.
  - `POST /api/auth/device/poll` — exchanges the device code for an
    access token once the user has authorized on github.com.

  No NextAuth, no database, no env vars, no client secret.

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

## Bonus

The legacy Space Runner game is preserved at
[`/space-runner/index.html`](./public/space-runner/index.html) and is also
served by the deployed app.
