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

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- NextAuth (GitHub OAuth) — `repo` scope, so the app can read and write to
  your private and public repos
- `@octokit/rest` for the GitHub REST API
- Direct `fetch` against the CloseRouter OpenAI-compatible API

## Setup

```bash
npm install
cp .env.example .env.local
# fill in GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, NEXTAUTH_SECRET
npm run dev
```

Then open <http://localhost:3000>.

### GitHub OAuth app

Create one at <https://github.com/settings/developers>:

- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

Copy the Client ID and Client Secret into `.env.local`.

### CloseRouter

Your CloseRouter API key is not stored on the server. It lives in your
browser's localStorage and is forwarded to the server only when you click
"Load models" or "Build with AI", which immediately uses it to call
`https://api.closerouter.dev/v1` (or a custom base URL you configure).

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
