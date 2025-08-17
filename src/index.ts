import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHubContextCollector } from './services/context_collector/github_context';

const run = async (): Promise<void> => {
  try {
    // Get the GitHub token from action inputs
    const token = core.getInput('github-token', { required: true });
    
    // Get the event payload
    const context = github.context;
    
    core.info(`Event name: ${context.eventName}`);
    core.info(`Event payload: ${JSON.stringify(context.payload, null, 2)}`);
    
    // Check if this is a comment event on a PR
    if (context.eventName !== 'issue_comment' || !context.payload.issue?.pull_request) {
      core.info('This action only runs on pull request comments');
      return;
    }
    
    // Check if the comment contains /note
    const comment = context.payload.comment?.body || '';
    if (!comment.includes('/note')) {
      core.info('Comment does not contain /note command');
      return;
    }
    
    // Extract PR information from the event
    const owner = context.repo.owner;
    const repo = context.repo.repo;
    const prNumber = context.payload.issue.number;
    
    core.info(`Processing /note command for PR #${prNumber} in ${owner}/${repo}`);
    
    // Create the context collector service
    const octokit = github.getOctokit(token);
    const contextCollector = new GitHubContextCollector(octokit);
    
    // Collect all PR context
    const prContext = await contextCollector.collectContext(owner, repo, prNumber);
    
    // Output collected context
    core.info('========== COLLECTED PR CONTEXT ==========');
    core.info(`PR Title: ${prContext.pullRequest.title}`);
    core.info(`PR Number: ${prContext.pullRequest.number}`);
    core.info(`PR Author: ${prContext.pullRequest.author}`);
    core.info(`Base Branch: ${prContext.pullRequest.baseBranch}`);
    core.info(`Head Branch: ${prContext.pullRequest.headBranch}`);
    core.info(`PR Body: ${prContext.pullRequest.body}`);
    
    core.info('\n========== COMMITS WITH FILE CHANGES ==========');
    core.info(`Total commits: ${prContext.commits.length}`);
    prContext.commits.forEach((commit, index) => {
      core.info(`\n--- Commit ${index + 1} ---`);
      core.info(`  SHA: ${commit.sha}`);
      core.info(`  Author: ${commit.author}`);
      core.info(`  Message: ${commit.message}`);
      core.info(`  Timestamp: ${commit.timestamp}`);
      core.info(`  Files changed: ${commit.fileChanges.length}`);
      
      commit.fileChanges.forEach((file, fileIndex) => {
        core.info(`\n    File ${fileIndex + 1}:`);
        core.info(`      Filename: ${file.filename}`);
        core.info(`      Status: ${file.status}`);
        core.info(`      Additions: ${file.additions}`);
        core.info(`      Deletions: ${file.deletions}`);
        if (file.patch) {
          core.info(`      Changes:`);
          core.info(`${file.patch}`);
        }
      });
    });
    
    core.info('\n========== COMMENTS ==========');
    core.info(`Total comments: ${prContext.comments.length}`);
    prContext.comments.forEach((comment, index) => {
      core.info(`Comment ${index + 1}:`);
      core.info(`  ID: ${comment.id}`);
      core.info(`  Author: ${comment.author}`);
      core.info(`  Created: ${comment.createdAt}`);
      core.info(`  Body: ${comment.body.substring(0, 100)}${comment.body.length > 100 ? '...' : ''}`);
    });
    
    core.info('\n========== FILE CHANGES ==========');
    core.info(`Total file changes: ${prContext.fileChanges.length}`);
    prContext.fileChanges.forEach((file, index) => {
      core.info(`File ${index + 1}:`);
      core.info(`  Filename: ${file.filename}`);
      core.info(`  Status: ${file.status}`);
      core.info(`  Additions: ${file.additions}`);
      core.info(`  Deletions: ${file.deletions}`);
      if (file.patch) {
        core.info(`  Patch (first 1000 chars): ${file.patch.substring(0, 1000)}${file.patch.length > 1000 ? '...' : ''}`);
      }
    });
    
    core.info('\n========== SUMMARY ==========');
    core.info(`Successfully collected context for PR #${prNumber}:`);
    const totalFileChanges = prContext.commits.reduce((total, commit) => total + commit.fileChanges.length, 0);
    core.info(`- Commits: ${prContext.commits.length}`);
    core.info(`- Comments: ${prContext.comments.length}`);
    core.info(`- Total file changes across all commits: ${totalFileChanges}`);
    core.info(`- Unique files changed: ${prContext.fileChanges.length}`);
    
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Error: ${error.message}`);
      core.error(`Stack trace: ${error.stack}`);
    } else {
      core.setFailed('Unknown error occurred');
    }
  }
};

run();
