export interface PullRequestContext {
  number: number;
  title: string;
  body: string;
  author: string;
  baseBranch: string;
  headBranch: string;
  owner: string;
  repo: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  timestamp: string;
  fileChanges: FileChange[];
}

export interface CommentInfo {
  id: number;
  body: string;
  author: string;
  createdAt: string;
}

export interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
  // impactArea?: "admin_panel" | "extension"; // e.g., "admin_panel", "extension"
  impactArea?: "components" | "main"; // e.g., "components", "main"

}

export interface PRContext {
  pullRequest: PullRequestContext;
  commits: CommitInfo[];
  comments: CommentInfo[];
}

export interface ContextCollectorService {
  collectContext(owner: string, repo: string, prNumber: number): Promise<PRContext>;
}