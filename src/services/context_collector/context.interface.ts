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
}

export interface PRContext {
  pullRequest: PullRequestContext;
  commits: CommitInfo[];
  comments: CommentInfo[];
  fileChanges: FileChange[];
}

export interface ContextCollectorService {
  collectContext(owner: string, repo: string, prNumber: number): Promise<PRContext>;
}