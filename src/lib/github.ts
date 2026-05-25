import { Octokit } from "@octokit/rest";

export function makeOctokit(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

export interface RepoSummary {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  private: boolean;
  default_branch: string;
  description: string | null;
  html_url: string;
  updated_at: string | null;
}

export async function listUserRepos(
  accessToken: string,
): Promise<RepoSummary[]> {
  const octokit = makeOctokit(accessToken);
  const repos: RepoSummary[] = [];
  // listForAuthenticatedUser returns user's own + collaborated repos.
  // Paginate up to a reasonable limit.
  for (let page = 1; page <= 5; page++) {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      page,
      sort: "updated",
      affiliation: "owner,collaborator,organization_member",
    });
    for (const r of data) {
      repos.push({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        owner: r.owner?.login ?? "",
        private: r.private,
        default_branch: r.default_branch,
        description: r.description,
        html_url: r.html_url,
        updated_at: r.updated_at,
      });
    }
    if (data.length < 100) break;
  }
  return repos;
}

export interface RepoTreeEntry {
  path: string;
  type: "blob" | "tree";
  size?: number;
  sha: string;
}

export async function getRepoTree(opts: {
  accessToken: string;
  owner: string;
  repo: string;
  ref?: string;
}): Promise<{ tree: RepoTreeEntry[]; branch: string; commitSha: string }> {
  const octokit = makeOctokit(opts.accessToken);
  const repoInfo = await octokit.repos.get({
    owner: opts.owner,
    repo: opts.repo,
  });
  const branch = opts.ref || repoInfo.data.default_branch;
  const branchInfo = await octokit.repos.getBranch({
    owner: opts.owner,
    repo: opts.repo,
    branch,
  });
  const commitSha = branchInfo.data.commit.sha;
  const treeSha = branchInfo.data.commit.commit.tree.sha;
  const { data } = await octokit.git.getTree({
    owner: opts.owner,
    repo: opts.repo,
    tree_sha: treeSha,
    recursive: "1",
  });
  const tree: RepoTreeEntry[] = (data.tree || [])
    .filter(
      (
        entry,
      ): entry is { path: string; type: "blob" | "tree"; sha: string; size?: number } => {
        return (
          typeof entry.path === "string" &&
          typeof entry.sha === "string" &&
          (entry.type === "blob" || entry.type === "tree")
        );
      },
    )
    .map((entry) => ({
      path: entry.path,
      type: entry.type,
      sha: entry.sha,
      size: entry.size,
    }));
  return { tree, branch, commitSha };
}

export async function getFileContent(opts: {
  accessToken: string;
  owner: string;
  repo: string;
  path: string;
  ref?: string;
}): Promise<string | null> {
  const octokit = makeOctokit(opts.accessToken);
  try {
    const { data } = await octokit.repos.getContent({
      owner: opts.owner,
      repo: opts.repo,
      path: opts.path,
      ref: opts.ref,
    });
    if (Array.isArray(data) || data.type !== "file") return null;
    if (typeof data.content !== "string") return null;
    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export interface CommitFilesResult {
  branch: string;
  commitSha: string;
  prUrl?: string;
  prNumber?: number;
}

export async function commitFilesToNewBranch(opts: {
  accessToken: string;
  owner: string;
  repo: string;
  baseBranch?: string;
  newBranch: string;
  files: GeneratedFile[];
  commitMessage: string;
  prTitle: string;
  prBody: string;
  openPr: boolean;
}): Promise<CommitFilesResult> {
  const octokit = makeOctokit(opts.accessToken);
  const repoInfo = await octokit.repos.get({
    owner: opts.owner,
    repo: opts.repo,
  });
  const base = opts.baseBranch || repoInfo.data.default_branch;
  const baseBranch = await octokit.repos.getBranch({
    owner: opts.owner,
    repo: opts.repo,
    branch: base,
  });
  const baseCommitSha = baseBranch.data.commit.sha;
  const baseTreeSha = baseBranch.data.commit.commit.tree.sha;

  // Create blobs
  const blobs = await Promise.all(
    opts.files.map(async (f) => {
      const blob = await octokit.git.createBlob({
        owner: opts.owner,
        repo: opts.repo,
        content: Buffer.from(f.content, "utf-8").toString("base64"),
        encoding: "base64",
      });
      return { path: f.path, sha: blob.data.sha };
    }),
  );

  // Create tree
  const newTree = await octokit.git.createTree({
    owner: opts.owner,
    repo: opts.repo,
    base_tree: baseTreeSha,
    tree: blobs.map((b) => ({
      path: b.path,
      mode: "100644",
      type: "blob",
      sha: b.sha,
    })),
  });

  // Create commit
  const commit = await octokit.git.createCommit({
    owner: opts.owner,
    repo: opts.repo,
    message: opts.commitMessage,
    tree: newTree.data.sha,
    parents: [baseCommitSha],
  });

  // Create branch ref
  await octokit.git.createRef({
    owner: opts.owner,
    repo: opts.repo,
    ref: `refs/heads/${opts.newBranch}`,
    sha: commit.data.sha,
  });

  let prUrl: string | undefined;
  let prNumber: number | undefined;
  if (opts.openPr) {
    const pr = await octokit.pulls.create({
      owner: opts.owner,
      repo: opts.repo,
      head: opts.newBranch,
      base,
      title: opts.prTitle,
      body: opts.prBody,
    });
    prUrl = pr.data.html_url;
    prNumber = pr.data.number;
  }

  return {
    branch: opts.newBranch,
    commitSha: commit.data.sha,
    prUrl,
    prNumber,
  };
}
