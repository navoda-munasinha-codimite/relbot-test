import { PRContext, CommitInfo } from '../context_collector/context.interface';
import { md_template } from '../md_docs/template.md';

export class PromptBuilder {

  /**
   * Build initial prompt with template and PR information
   */
  buildInitialPrompt(prContext: PRContext): string {
    const template = md_template;
    
    return `
You are part of a larger document generation process. This is the initial step to create a development release note.

IMPORTANT INSTRUCTIONS:
- Return ONLY the markdown (.md) code without any greetings, explanations, or additional text
- Do not include phrases like "Here's your code" or any conversational text
- This is a sub-prompt of a bigger process
- Replace template placeholders with actual PR information provided below

TEMPLATE:
${template}

PR INFORMATION:
- PR Title: ${prContext.pullRequest.title}
- PR Description: ${prContext.pullRequest.body || 'No description provided'}
- PR Author: ${prContext.pullRequest.author}
- Base Branch: ${prContext.pullRequest.baseBranch}
- Head Branch: ${prContext.pullRequest.headBranch}
- PR Number: ${prContext.pullRequest.number}
- Repository: ${prContext.pullRequest.owner}/${prContext.pullRequest.repo}

Generate the initial development release note by replacing placeholders with appropriate values from the PR information.
`;
  }

  /**
   * Build prompt for processing individual commit changes
   */
  buildCommitPrompt(currentDoc: string, commit: CommitInfo): string {
    const fileChangesText = this.formatFileChanges(commit.fileChanges);
    
    return `
You are part of a larger document generation process. This is a sub-prompt for updating a development release note with commit information.

IMPORTANT INSTRUCTIONS:
- Return ONLY the updated markdown (.md) code without any greetings, explanations, or additional text
- This is a sub-prompt of a bigger process
- If this commit represents a minor change that doesn't significantly affect the functionality or isn't worth mentioning in detail, mark it as "<<minor change>>" in the appropriate section
- DO NOT remove "<<minor change>>" markers - they are needed for future processing steps
- UPDATE the Contributors section: If the commit author "${commit.author}" is not already listed in the Contributors section, add them to the list
- Integrate the commit changes into the existing document structure
- Maintain the overall document format and structure

CURRENT DOCUMENT:
${currentDoc}

COMMIT INFORMATION:
- Commit SHA: ${commit.sha}
- Commit Message: ${commit.message}
- Author: ${commit.author}
- Timestamp: ${commit.timestamp}

FILE CHANGES:
${fileChangesText}

Update the development release note by incorporating this commit's changes and ensuring the Contributors section includes "${commit.author}" if not already present.
`;
  }

  /**
   * Build final optimization prompt
   */
  buildFinalOptimizationPrompt(currentDoc: string): string {
    return `
You are part of a larger document generation process. This is the final optimization step for a development release note.

IMPORTANT INSTRUCTIONS:
- Return ONLY the optimized markdown (.md) code without any greetings, explanations, or additional text
- Review the full development release note and optimize it
- Consider "<<minor change>>" markers for the final output:
  * Remove completely if unnecessary
  * Merge into other points if they can be combined
  * Keep only if they add meaningful value
- Keep the dev note concise, well-structured, and easy to follow
- Remove unnecessary content and merge similar changes
- Ensure the document flows logically and is professional
- Maintain the overall template structure

CURRENT DOCUMENT TO OPTIMIZE:
${currentDoc}

Provide the final, optimized development release note.
`;
  }

  /**
   * Format file changes for the prompt
   */
  private formatFileChanges(fileChanges: any[]): string {
    if (!fileChanges || fileChanges.length === 0) {
      return 'No file changes in this commit.';
    }

    return fileChanges.map((file, index) => `
File ${index + 1}:
- Filename: ${file.filename}
- Status: ${file.status}
- Additions: ${file.additions}
- Deletions: ${file.deletions}
${file.patch ? `- Changes:\n${file.patch}` : '- No patch data available'}
`).join('\n');
  }
}
