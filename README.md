# gma codegen

An AI code generator for your GitHub repos, powered by your
[CloseRouter](https://closerouter.dev/dashboard) API key.

Paste two tokens into the app, pick a repo + a model, write what you want
built. The AI commits the changes to a new branch in your repo and opens a
pull request. Your default branch is never touched.

## Deploy in 3 steps (works from a phone)

> First merge the PR that introduces this app into the repo's default branch,
> so the Deploy button picks up the Next.js code instead of the old
> `index.html`.

1. **Click the button** — no env vars to set, just pick a project name
   (e.g. `gma-codegen`) and hit Deploy.

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fakelosk41-byte%2Fgma&project-name=gma-codegen&repository-name=gma-codegen)

2. **Open your Vercel URL** (something like
   `https://gma-codegen-xyz.vercel.app`).

3. **Paste two tokens on the home page** and hit Save:

   - **GitHub Personal Access Token** — create one at
     <https://github.com/settings/tokens/new?scopes=repo&description=gma+codegen>.
     The link pre-fills the `repo` scope. Click "Generate token" and copy
     the `ghp_…` string.
   - **CloseRouter API key** — grab it from
     <https://closerouter.dev/dashboard>.

   Click "Load repos", pick a repo, click "Load models", pick a model, type
   what you want built, click "Build with AI". You're done.

Both tokens live only in your browser's `localStorage` and are forwarded to
the server only when an API call needs them. They are not persisted on
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
- No OAuth, no NextAuth, no database — the app is fully client-credential
  driven

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
