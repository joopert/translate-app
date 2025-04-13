# Getting Started

## autoupdate-pre-commit

You need to add a Personal Access Token called `PRECOMMIT_PR_TOKEN` to your repository secrets.

### Steps to create and add a PAT

1. Create a Personal Access Token:
   - Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens
   - Click "Generate new token"
   - Set appropriate permissions: at minimum, "Contents: write" and "Pull Requests: write"
   - Copy the generated token (you'll only see it once)
2. Add the token as a repository secret:
   - Go to your repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `PRECOMMIT_PR_TOKEN` (matching what we put in the workflow file)
   - Value: Paste your token
   - Click "Add secret"
