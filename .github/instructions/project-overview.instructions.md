---
applyTo: '**'
---

This is a custom GitHub Action project written in TypeScript. Its purpose is to generate release notes for specific pull requests (PRs) when a user comments `/note` on the PR. The workflow is triggered by this comment and collects all relevant information, including:

- All commit messages in the PR
- All comments on the PR
- File changes with commit code diffs
- PR title and description
- Commit authors
- PR author
