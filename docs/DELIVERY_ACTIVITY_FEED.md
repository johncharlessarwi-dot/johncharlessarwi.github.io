# Portfolio delivery activity feed

The portfolio's **Delivery Activity** panel displays recent GitHub Actions workflow runs from this public repository:

https://github.com/johncharlessarwi-dot/johncharlessarwi.github.io/actions

## How it works

- The server-side endpoint is `/api/deployments`.
- It reads public workflow-run metadata from the GitHub REST API.
- It displays the workflow name, run status, commit title, branch, short commit SHA, relative time and a link to each workflow run.
- The endpoint is read-only and briefly cached.

## Configuration

No Vercel API token, GitHub personal access token, or additional environment variable is required. The repository is public, so GitHub exposes workflow-run metadata through its unauthenticated API.

## Important distinction

This panel shows CI/CD workflow activity. It is not a complete list of Vercel production deployments. The portfolio itself continues to deploy through the connected Vercel-Git integration.

If the panel is temporarily unavailable, check the public GitHub Actions page and refresh the portfolio.
