# Release Note Bot Setup

## Environment Variables

To use this action, you need to set up the following environment variables:

### Required
- `GEMINI_API_KEY`: Your Google Gemini API key for generating release notes

### Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your actual Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

3. For GitHub Actions, add the `GEMINI_API_KEY` as a repository secret.

## Usage

The action is triggered when someone comments `/note` on a pull request. It will:

1. Collect PR context (commits, comments, file changes)
2. Generate a development release note using Gemini AI
3. Output the generated release note in the action logs

## Local Development

For local development, make sure you have a `.env` file with the required environment variables.
