import * as core from '@actions/core';
import * as github from '@actions/github';
import { GitHubContextCollector } from './services/context_collector/github_context';
import { MarkdownDocumentCreator } from './services/md_docs/md_create';
import { GeminiService } from './services/llm/gemini';

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const run = async (): Promise<void> => {
  try {
    // Get the GitHub token from action inputs
    const token = core.getInput('github-token', { required: true });
    
    // Get Gemini API key from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    
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
    
    // Initialize Gemini LLM service
    const geminiService = new GeminiService({
      apiKey: geminiApiKey,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    });
    
    // Initialize markdown document creator
    const documentCreator = new MarkdownDocumentCreator(geminiService);
    
    // Generate release note
    core.info('Generating release note...');
    const releaseNote = await documentCreator.generateReleaseNote(prContext);
    
    // Output the generated release note
    core.info('========== GENERATED RELEASE NOTE ==========');
    core.info(releaseNote);
    core.info('===============================================');
    
    core.info(`Release note generated successfully for PR #${prNumber}`);
    
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
