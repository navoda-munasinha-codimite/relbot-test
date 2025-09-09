import { PRContext, CommitInfo } from '../context_collector/context.interface';

const dataStructure = `{
    "overview": "string (overview of all changes. should be small like below 30 words)",
    "release_description": "string (detailed description of the release. should be in detail and need pointwise separated with a newline)",
    "impacted_areas_components": "string (small one or two line description of impacted areas in components)",
    "impacted_areas_main": "string (small one or two line description of impacted areas in main)",
    "summary_of_changes": "string (summary of changes in the release. should be short and need pointwise separated with a newline)"
}`;

export class GoogleDocsPromptBuilder {

  /**
   * Build initial prompt for creating the initial JSON structure
   */
  buildInitialPrompt(prContext: PRContext): string {
    return `
You are part of a larger document generation process. This is the initial step to create a development release note.

IMPORTANT INSTRUCTIONS:
- Return ONLY the JSON string without any greetings, explanations, or additional text
- Do not include phrases like "Here's your code" or any conversational text
- This is a sub-prompt of a bigger process
- Create initial JSON structure with PR information provided below
- Ensure the final output is in valid JSON format with the following structure:
${dataStructure}

PR INFORMATION:
- PR Title: ${prContext.pullRequest.title}
- PR Description: ${prContext.pullRequest.body || 'No description provided'}
- PR Author: ${prContext.pullRequest.author}
- Base Branch: ${prContext.pullRequest.baseBranch}
- Head Branch: ${prContext.pullRequest.headBranch}
- PR Number: ${prContext.pullRequest.number}
- Repository: ${prContext.pullRequest.owner}/${prContext.pullRequest.repo}

Generate the initial development release note JSON by populating the structure with appropriate values from the PR information.
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
- Return ONLY the updated JSON string without any greetings, explanations, or additional text
- This is a sub-prompt of a bigger process
- If this commit represents a minor change that doesn't significantly affect the functionality or isn't worth mentioning in detail, mark it as "<<minor change>>" in the appropriate section
- DO NOT remove "<<minor change>>" markers - they are needed for future processing steps
- Ensure the final output is in valid JSON format with the following structure:
${dataStructure}
- If a section has no relevant information, set its value to "<<no changes>>"
- Maintain the existing structure and content of the document, only updating sections as necessary based on the commit information

CURRENT DOCUMENT:
${currentDoc}

COMMIT INFORMATION:
- Commit Message: ${commit.message}

FILE CHANGES:
${fileChangesText}

Update the development release note JSON by incorporating this commit's changes while maintaining the required structure.
`;
  }

  /**
   * Build final optimization prompt
   */
  buildFinalOptimizationPrompt(currentDoc: string): string {
    return `
You are part of a larger document generation process. This is the final optimization step for a development release note.

IMPORTANT INSTRUCTIONS:
- Return ONLY the optimized JSON string without any greetings, explanations, or additional text
- Review the full development release note and optimize it
- Consider "<<minor change>>" markers for the final output:
  * Remove completely if unnecessary
  * Merge into other points if they can be combined
  * Keep only if they add meaningful value
- Keep the content concise, well-structured, and easy to follow
- Remove unnecessary content and merge similar changes
- Ensure the document flows logically and is professional
- Maintain the required JSON structure:
${dataStructure}

CURRENT DOCUMENT TO OPTIMIZE:
${currentDoc}

Provide the final, optimized development release note as a valid JSON string.
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
- Impacted Area: ${file.impactArea || 'N/A'}
${file.patch ? `- Changes:\n${file.patch}` : '- No patch data available'}
`).join('\n');
  }
}