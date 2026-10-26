# Order email troubleshooting

This guide covers the portfolio order form at `/api/contact`, the Google Apps Script web app, and Gmail delivery.

## First: understand the two endpoints

- Portfolio API: `POST https://john-charles-sarwi-portfolio.vercel.app/api/contact`
- Google Apps Script: the private deployment URL stored in Vercel as `GOOGLE_APPS_SCRIPT_URL`.

The browser must submit to the portfolio API. Do not put the Apps Script URL or webhook secret in browser JavaScript.

## Error reference

| Symptom | Meaning | Recovery |
| --- | --- | --- |
| `Script function not found: doPost` | The deployed Apps Script version does not expose a top-level `function doPost(e)`. | Open the exact Apps Script project, confirm `Code.gs` contains the handler at top level, save, then Deploy → Manage deployments → Edit → New version → Deploy. |
| `{"ok":false,"error":"Unauthorized"}` | The handler ran, but its script property does not match the secret sent by Vercel, or the property is empty. | In Apps Script → Project Settings → Script properties, set `ORDER_WEBHOOK_SECRET` to the same value as Vercel's server-only `ORDER_WEBHOOK_SECRET`. Never paste the value into GitHub or chat. |
| HTTP 405 from Apps Script | The request reached a URL that does not accept POST, often because a redirect was followed with the wrong method or the URL is not the deployed `/exec` endpoint. | Confirm the URL ends in `/exec`, the deployment is a Web app, and the caller sends POST. The Vercel handler uses `redirect: "follow"`; test through the portfolio API. |
| Portfolio API HTTP 503 | `GOOGLE_APPS_SCRIPT_URL` is missing from the active Vercel environment. | Add it to the correct Production environment and redeploy. |
| Portfolio API HTTP 502 | Apps Script returned a non-success result, Gmail failed, or the upstream request failed. | Check Apps Script → Executions for the latest failed execution; confirm Gmail authorization and script properties. |
| API says success but no email is visible | The provider accepted the script request, but inbox placement or final delivery has not been independently confirmed. | Check Inbox, Spam, All Mail, recipient spelling, and Apps Script execution details. |

## Safe deployment checklist

1. In Apps Script, confirm `Code.gs` defines `function doPost(e)` and `function output(value)` at the top level.
2. Save the script.
3. Deploy → Manage deployments → Edit → select **New version** → Deploy.
4. The Web app must execute as **Me** and allow access to **Anyone** for this server-to-server webhook.
5. In Apps Script Script properties, configure `ORDER_WEBHOOK_SECRET`. Optionally configure `ORDER_INBOX`; otherwise the script defaults to `johncharlessarwi@gmail.com`.
6. In Vercel Production environment variables, configure `GOOGLE_APPS_SCRIPT_URL` and `ORDER_WEBHOOK_SECRET`. The secret values must match exactly.
7. Redeploy the Vercel project after changing environment variables.
8. Submit a real test order through the live portfolio form and save the displayed order reference.
9. Confirm both the business notification and customer acknowledgement in their respective mailboxes.

## Important security notes

- Never commit secrets, deployment tokens, or customer submissions to this repository.
- Keep the webhook secret in server-side Vercel environment variables and Apps Script Script properties only.
- Do not test with a fake secret and interpret the expected Unauthorized response as a deployment failure.
- A successful HTTP response from the portfolio API proves the API accepted the upstream success response. It does not by itself prove that a human opened or saw the email.
