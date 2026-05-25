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
     shows the list of available models and remembers your pick.
   - **Step 2 — Sign in with GitHub.** First time only, create a GitHub
     OAuth App at <https://github.com/settings/applications/new>:
     - *Application name*: anything (e.g. `gma-codegen`).
     - *Homepage URL*: your Vercel URL.
     - *Authorization callback URL*: same as Homepage URL (required by
       GitHub, not used by us).
     - **Enable the "Device flow" checkbox.**
     - Click *Register application* → copy the **Client ID** (no client
       secret needed).

     Paste the Client ID, click *Sign in with GitHub*. The app shows an
     8-character code; tap *Open GitHub*, paste the code, authorize. The
     app polls in the background and finishes the sign-in for you.
   - **Step 3 — Your repositories.** Pick a repo, click *Load models* if
     needed, type what you want built, click *Build with AI*. You'll get
     a new branch and a PR link.

All credentials live only in your browser's `localStorage`. They are sent
to the server only when an API call needs them; they are not persisted on
Vercel.

## Run locally instead

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>. No `.env` file is required.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- `@octokit/rest` for the GitHub REST API
- Direct `fetch` against the CloseRouter OpenAI-compatible API
- GitHub OAuth **Device Flow** for sign-in — no callback URL handling, no
  client secret, no NextAuth, no database

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
