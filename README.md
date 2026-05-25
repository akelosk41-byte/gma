# gma codegen

An AI code generator for your GitHub repos, powered by your
[CloseRouter](https://closerouter.dev/dashboard) API key.

You enter your CloseRouter key, check available models, sign in with GitHub
via OAuth, then pick a repo and write a prompt. The AI commits the changes
to a new branch in your repo and opens a pull request. Your default branch
is never touched.

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
   - **Step 2 — Sign in with GitHub (OAuth callback flow).** First time
     only, the page tells you the exact *Authorization callback URL* for
     your deploy (`https://YOUR-VERCEL-URL/api/auth/callback`) — copy it.
     Then create a GitHub OAuth App at
     <https://github.com/settings/applications/new>:
     - *Application name*: anything (e.g. `gma-codegen`).
     - *Homepage URL*: your Vercel URL.
     - *Authorization callback URL*: paste the value you copied.
     - Click *Register application* → click *Generate a new client secret*.
     - Copy the **Client ID** and the **Client Secret**.

     Paste both into the form on the home page and click *Sign in with
     GitHub*. You'll be redirected to github.com, you click *Authorize*,
     GitHub bounces you back to the app, and your token is saved in the
     browser's `localStorage`.
   - **Step 3 — Your repositories.** Pick a repo, type what you want
     built, click *Build with AI*. You'll get a new branch and a PR link.

All credentials live only in your browser's `localStorage`. The Client
Secret is forwarded to this app's own backend during sign-in (so it can
complete the OAuth code exchange with GitHub), then immediately discarded
from the server. Nothing is persisted on Vercel.

## Run locally instead

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. No `.env` file is required. When
registering a GitHub OAuth App for local use, set the callback URL to
`http://localhost:3000/api/auth/callback`.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- `@octokit/rest` for the GitHub REST API
- Direct `fetch` against the CloseRouter OpenAI-compatible API
- Standard GitHub OAuth web flow handled in two routes:
  - `POST /api/auth/start` — stashes the Client ID + Secret + state in
    HttpOnly cookies for the round-trip and returns the GitHub authorize
    URL.
  - `GET /api/auth/callback` — verifies state, exchanges the code for an
    access token, returns a page that writes the token to `localStorage`
    and redirects home.

  No NextAuth, no database, no env vars.

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
