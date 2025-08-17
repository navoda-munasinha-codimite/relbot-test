import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { 
  PullRequestContext, 
  CommitInfo, 
  CommentInfo, 
  FileChange, 
  PRContext, 
  ContextCollectorService 
} from './context.interface';

export class GitHubContextCollector implements ContextCollectorService {
  constructor(private octokit: InstanceType<typeof GitHub>) {}

  async collectContext(owner: string, repo: string, prNumber: number): Promise<PRContext> {
    core.info(`Collecting context for PR #${prNumber} in ${owner}/${repo}`);

    // Fetch PR details
    const { data: pr } = await this.octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    const pullRequest: PullRequestContext = {
      number: pr.number,
      title: pr.title,
      body: pr.body || '',
      author: pr.user?.login || 'unknown',
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
      owner,
      repo,
    };

    // Fetch commits
    const commits = await this.fetchCommits(owner, repo, prNumber);
    
    // Fetch comments
    const comments = await this.fetchComments(owner, repo, prNumber);
    
    // Fetch file changes
    const fileChanges = await this.fetchFileChanges(owner, repo, prNumber);

    return {
      pullRequest,
      commits,
      comments,
      fileChanges,
    };
  }

  private async fetchCommits(owner: string, repo: string, prNumber: number): Promise<CommitInfo[]> {
    core.info(`Fetching commits for PR #${prNumber}`);
    const commits: CommitInfo[] = [];
    
    try {
      // GitHub API pagination
      for await (const response of this.octokit.paginate.iterator(
        this.octokit.rest.pulls.listCommits,
        {
          owner,
          repo,
          pull_number: prNumber,
          per_page: 100,
        }
      )) {
        for (const commit of response.data) {
          // Fetch file changes for this specific commit
          const fileChanges = await this.fetchCommitFileChanges(owner, repo, commit.sha);
          
          commits.push({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author?.name || commit.author?.login || 'unknown',
            timestamp: commit.commit.author?.date || new Date().toISOString(),
            fileChanges,
          });
        }
      }
      
      core.info(`Fetched ${commits.length} commits with their file changes`);
    } catch (error) {
      core.error(`Error fetching commits: ${error}`);
    }
    
    return commits;
  }

  private async fetchComments(owner: string, repo: string, prNumber: number): Promise<CommentInfo[]> {
    core.info(`Fetching comments for PR #${prNumber}`);
    const comments: CommentInfo[] = [];
    
    try {
      // Fetch issue comments
      for await (const response of this.octokit.paginate.iterator(
        this.octokit.rest.issues.listComments,
        {
          owner,
          repo,
          issue_number: prNumber,
          per_page: 100,
        }
      )) {
        for (const comment of response.data) {
          comments.push({
            id: comment.id,
            body: comment.body || '',
            author: comment.user?.login || 'unknown',
            createdAt: comment.created_at,
          });
        }
      }
      
      // Fetch review comments
      for await (const response of this.octokit.paginate.iterator(
        this.octokit.rest.pulls.listReviewComments,
        {
          owner,
          repo,
          pull_number: prNumber,
          per_page: 100,
        }
      )) {
        for (const comment of response.data) {
          comments.push({
            id: comment.id,
            body: comment.body,
            author: comment.user?.login || 'unknown',
            createdAt: comment.created_at,
          });
        }
      }
      
      core.info(`Fetched ${comments.length} total comments`);
    } catch (error) {
      core.error(`Error fetching comments: ${error}`);
    }
    
    return comments;
  }

  private async fetchFileChanges(owner: string, repo: string, prNumber: number): Promise<FileChange[]> {
    core.info(`Fetching file changes for PR #${prNumber}`);
    const fileChanges: FileChange[] = [];
    
    try {
      for await (const response of this.octokit.paginate.iterator(
        this.octokit.rest.pulls.listFiles,
        {
          owner,
          repo,
          pull_number: prNumber,
          per_page: 100,
        }
      )) {
        for (const file of response.data) {
          fileChanges.push({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            patch: file.patch,
          });
        }
      }
      
      core.info(`Fetched ${fileChanges.length} file changes`);
    } catch (error) {
      core.error(`Error fetching file changes: ${error}`);
    }
    
    return fileChanges;
  }

  private async fetchCommitFileChanges(owner: string, repo: string, sha: string): Promise<FileChange[]> {
    const fileChanges: FileChange[] = [];
    
    try {
      const { data: commit } = await this.octokit.rest.repos.getCommit({
        owner,
        repo,
        ref: sha,
      });
      
      if (commit.files) {
        for (const file of commit.files) {
          fileChanges.push({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            patch: file.patch,
          });
        }
      }
    } catch (error) {
      core.error(`Error fetching file changes for commit ${sha}: ${error}`);
    }
    
    return fileChanges;
  }
}