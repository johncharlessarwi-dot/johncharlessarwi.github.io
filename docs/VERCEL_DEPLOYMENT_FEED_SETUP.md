# Vercel deployment feed setup

The portfolio's **Live Delivery Log** reads deployment metadata from the Vercel API. The endpoint is intentionally server-side and does not expose the API token to visitors.

## Current configuration

The API route is `/api/deployments`. It requires:

| Variable | Required | Purpose |
| --- | --- | --- |
| `VERCEL_API_TOKEN` | Yes | Read-only access token used by the server-side deployment feed. |
| `VERCEL_TEAM_ID` | Optional | Team scope. The route currently has a default team ID, so this can be omitted unless the project is moved. |

## Configure the token

1. Open the Vercel dashboard and go to **Account Settings → Tokens**.
2. Create a token dedicated to the portfolio deployment feed. Give it access to the team that owns the listed projects and choose an appropriate expiry.
3. Open the portfolio project: **Settings → Environment Variables**.
4. Add `VERCEL_API_TOKEN` as a **Sensitive** environment variable for Production. Add Preview too only if you want the feed enabled on preview deployments.
5. Save the variable and redeploy the portfolio.
6. Open `https://john-charles-sarwi-portfolio.vercel.app/api/deployments`. A successful response contains a `deployments` array. The homepage Live Delivery Log should then populate.

## Security

- Never put the token in `app.js`, HTML, CSS, a public repository file, or a browser request.
- Never paste the token into a chat or issue.
- If the feed returns HTTP 503, the token is missing.
- If it returns HTTP 502, check token access to the Vercel team and projects.
- Rotate or revoke the token in Vercel if it is exposed.

The rest of the portfolio remains usable if the deployment feed is not configured; the page displays a configuration message instead of fabricated deployment data.
