---
applyTo: '**'
---

This is a custom GitHub Action project written in TypeScript that creates a separate reusable GitHub Action. Its purpose is to generate development release notes for specific pull requests (PRs) when a user comments `/note` on the PR. 

## Project Overview
The action collects PR information and uses it to create a development release note in Markdown format. While the main idea is to eventually create Google Docs, due to resource constraints, we currently generate `.md` files stored in the `src/mddocs` folder.

## Current Implementation
The workflow collects:
- All commit messages in the PR
- All comments on the PR  
- File changes with commit code diffs
- PR title and description
- Commit authors
- PR author

## Document Generation Process

### Structure
- **src/md_docs/**: Contains interfaces, `md_create.ts` for document generation, and `template.md` as reference
- **Prompt building code**: Separate folder for prompt construction logic
- **currentDoc variable**: Stores the current generated document state (in `src/md_docs/md_create.ts`)

### Generation Workflow

1. **Initial Prompt**: 
   - Send template with PR info (author email, name, branches, PR title, description)
   - Specify in prompt: "Return ONLY the .md code without greetings or explanations"
   - Store result in `currentDoc` variable

2. **Commit Processing**:
   - Send `currentDoc` with each commit info and changed code
   - For minor changes not worth mentioning: mark as `<<minor change>>` in MD file
   - Specify in prompt: "Do NOT remove <<minor change>> markers - they are needed for future processing"
   - Mention this is a sub-prompt of a larger process

3. **Developer Participation Tracking**:
   - Template section for developers who participated
   - Add names by commit - if `currentDoc` doesn't have the name, add it

4. **Final Optimization**:
   - Review full current dev note and optimize
   - Consider `<<minor changes>>` markers for final output
   - Remove if completely unnecessary or merge into other points if needed
   - Keep dev notes concise, well-structured, and easy to follow
   - Remove unnecessary content and merge similar changes


## Code Quality Guidelines
- Use arrow functions throughout the codebase
- Implement interfaces when needed to maintain type safety
- Only modify files that require changes - avoid unnecessary updates to tests, README files, or other markdown documentation
- Focus development efforts on functional code changes rather than documentation updates