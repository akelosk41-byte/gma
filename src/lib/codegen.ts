import {
  getFileContent,
  getRepoTree,
  type GeneratedFile,
  type RepoTreeEntry,
} from "./github";
import { chatCompletion, type ChatMessage } from "./closerouter";

const SMALL_FILE_BYTES = 4_000;
const MAX_FILES_INLINED = 20;
const MAX_TREE_ENTRIES_LISTED = 400;

const TEXT_EXTS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "json",
  "md",
  "txt",
  "yml",
  "yaml",
  "toml",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "kt",
  "swift",
  "c",
  "h",
  "cc",
  "cpp",
  "hpp",
  "cs",
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "vue",
  "svelte",
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "sql",
  "graphql",
  "gql",
  "xml",
  "ini",
  "cfg",
  "env",
]);

function looksLikeText(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase();
  if (!ext) return false;
  return TEXT_EXTS.has(ext);
}

export interface RepoContextSummary {
  branch: string;
  commitSha: string;
  files: Array<{ path: string; size?: number }>;
  inlined: Array<{ path: string; content: string }>;
  truncated: boolean;
}

export async function buildRepoContext(opts: {
  accessToken: string;
  owner: string;
  repo: string;
  ref?: string;
}): Promise<RepoContextSummary> {
  const { tree, branch, commitSha } = await getRepoTree(opts);
  const fileEntries = tree.filter(
    (entry): entry is RepoTreeEntry & { type: "blob" } => entry.type === "blob",
  );
  const truncated = fileEntries.length > MAX_TREE_ENTRIES_LISTED;
  const listed = fileEntries.slice(0, MAX_TREE_ENTRIES_LISTED);

  const inlineCandidates = listed
    .filter((entry) => looksLikeText(entry.path))
    .filter((entry) =>
      typeof entry.size === "number" ? entry.size <= SMALL_FILE_BYTES : true,
    )
    .slice(0, MAX_FILES_INLINED);

  const inlined: Array<{ path: string; content: string }> = [];
  for (const entry of inlineCandidates) {
    const content = await getFileContent({
      accessToken: opts.accessToken,
      owner: opts.owner,
      repo: opts.repo,
      path: entry.path,
      ref: branch,
    });
    if (content !== null && content.length <= SMALL_FILE_BYTES * 2) {
      inlined.push({ path: entry.path, content });
    }
  }

  return {
    branch,
    commitSha,
    files: listed.map((e) => ({ path: e.path, size: e.size })),
    inlined,
    truncated,
  };
}

export const SYSTEM_PROMPT = `You are an AI software engineer working on a user's GitHub repository.

Your job: given the existing repository contents and a user request, output the COMPLETE NEW CONTENTS of any files that should be created or updated to fulfill the request.

Output requirements (STRICT):
- Reply with a SINGLE JSON object and nothing else.
- The JSON object MUST have this shape:
  {
    "summary": "one-paragraph summary of changes",
    "files": [
      { "path": "relative/path/to/file.ext", "content": "FULL FILE CONTENT" }
    ]
  }
- "files" contains FULL file contents (no diffs, no patches). Each listed file will overwrite the existing file at that path or create it.
- Do NOT include files you are not changing.
- Do NOT include explanations, code fences, or markdown — only raw JSON.
- Keep paths relative to the repo root. No leading "/" or "./".
- Do not create binary files.
`;

export function buildUserPrompt(opts: {
  userPrompt: string;
  context: RepoContextSummary;
  owner: string;
  repo: string;
}): string {
  const filesList = opts.context.files
    .map((f) => `- ${f.path}${typeof f.size === "number" ? ` (${f.size} B)` : ""}`)
    .join("\n");

  const inlinedBlocks = opts.context.inlined
    .map(
      (f) =>
        `--- BEGIN FILE: ${f.path} ---\n${f.content}\n--- END FILE: ${f.path} ---`,
    )
    .join("\n\n");

  return [
    `Repository: ${opts.owner}/${opts.repo} (branch: ${opts.context.branch})`,
    `Existing files${opts.context.truncated ? " (truncated)" : ""}:`,
    filesList || "(repo is empty)",
    "",
    inlinedBlocks
      ? "Contents of selected text files (small files only):\n\n" + inlinedBlocks
      : "No file contents inlined.",
    "",
    "User request:",
    opts.userPrompt,
    "",
    "Respond now with a single JSON object as specified.",
  ].join("\n");
}

export interface ParsedGeneration {
  summary: string;
  files: GeneratedFile[];
}

export function parseGenerationOutput(raw: string): ParsedGeneration {
  const trimmed = raw.trim();
  const candidates: string[] = [];
  candidates.push(trimmed);

  // Try to strip ```json ... ``` fences if present.
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    candidates.push(fenceMatch[1].trim());
  }

  // Try to extract the largest balanced JSON object.
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(trimmed.slice(firstBrace, lastBrace + 1));
  }

  let lastError: unknown = null;
  for (const c of candidates) {
    try {
      const parsed = JSON.parse(c);
      if (parsed && typeof parsed === "object") {
        const summary =
          typeof (parsed as { summary?: unknown }).summary === "string"
            ? ((parsed as { summary: string }).summary as string)
            : "";
        const filesRaw = (parsed as { files?: unknown }).files;
        if (!Array.isArray(filesRaw)) continue;
        const files: GeneratedFile[] = [];
        for (const item of filesRaw) {
          if (!item || typeof item !== "object") continue;
          const obj = item as Record<string, unknown>;
          const p = obj.path;
          const cont = obj.content;
          if (typeof p !== "string" || typeof cont !== "string") continue;
          const cleanPath = p.replace(/^\.\//, "").replace(/^\/+/, "");
          if (!cleanPath) continue;
          files.push({ path: cleanPath, content: cont });
        }
        if (files.length === 0) continue;
        return { summary, files };
      }
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(
    `Could not parse model response as JSON with files. ${
      lastError instanceof Error ? lastError.message : ""
    }`,
  );
}

export async function runCodegen(opts: {
  apiKey: string;
  baseUrl?: string;
  model: string;
  userPrompt: string;
  context: RepoContextSummary;
  owner: string;
  repo: string;
  temperature?: number;
}): Promise<ParsedGeneration & { rawResponse: string }> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: buildUserPrompt({
        userPrompt: opts.userPrompt,
        context: opts.context,
        owner: opts.owner,
        repo: opts.repo,
      }),
    },
  ];
  const completion = await chatCompletion({
    apiKey: opts.apiKey,
    baseUrl: opts.baseUrl,
    model: opts.model,
    messages,
    temperature: opts.temperature ?? 0.2,
  });
  const raw = completion.choices?.[0]?.message?.content ?? "";
  if (!raw) {
    throw new Error("Empty response from model.");
  }
  const parsed = parseGenerationOutput(raw);
  return { ...parsed, rawResponse: raw };
}
