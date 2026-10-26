# Order email setup — Google Apps Script

The portfolio sends project enquiries through the server-side Vercel API to Google Apps Script. Gmail sends one detailed notification to the business inbox and one acknowledgement to the customer.

## 1. Prepare the Apps Script project

1. Sign in to the Google account that should send order emails.
2. Open https://script.google.com/ and open the Apps Script project used by this portfolio.
3. Copy the complete contents of `google-apps-script/Code.gs` into the editor file named `Code.gs`.
4. Confirm that `function doPost(e)` and `function output(value)` are defined at the top level, not nested inside another function.
5. Save the project.

## 2. Configure Apps Script properties

Open Project Settings → Script properties and add:

| Property | Value |
| --- | --- |
| `ORDER_WEBHOOK_SECRET` | A long random secret (at least 32 characters). |
| `ORDER_INBOX` | Optional; defaults to `johncharlessarwi@gmail.com`. |

The secret must match Vercel's server-side `ORDER_WEBHOOK_SECRET` exactly. Do not put it in source code, GitHub, frontend JavaScript, screenshots, or chat.

## 3. Deploy or update the Web App

For the first deployment, select Deploy → New deployment → Web app.

For an existing deployment, select Deploy → Manage deployments → Edit (pencil) → Version → **New version** → Deploy. Saving the editor alone does not update an already deployed version.

Use these settings:

- **Execute as:** Me
- **Who has access:** Anyone

Authorize the requested Gmail permissions when Google prompts you. Copy the Web App URL ending in `/exec`. When editing an existing deployment, its URL usually remains the same.

## 4. Configure Vercel

In the Vercel project settings, configure these server-side environment variables for Production:

- `GOOGLE_APPS_SCRIPT_URL`: the deployed Web App `/exec` URL.
- `ORDER_WEBHOOK_SECRET`: exactly the same secret stored in Apps Script.

Keep the values private. Redeploy the Vercel project after adding or changing environment variables.

## 5. Verify delivery

1. Open the live portfolio and submit a genuine test enquiry using an inbox you can access.
2. Wait for the form's success state and record the generated `JOS-YYYYMMDD-XXXXX` reference.
3. Check the business inbox for **New project order**.
4. Check the customer inbox for **We received your project request**.
5. Check Spam and All Mail if either message is missing.
6. In Apps Script → Executions, inspect the latest execution if the portfolio reports a delivery error.

A successful portfolio API response confirms that the server received an `ok: true` response from Apps Script. It does not independently prove inbox placement or that the recipient has read the email.

## Troubleshooting

See [ORDER_EMAIL_TROUBLESHOOTING.md](./ORDER_EMAIL_TROUBLESHOOTING.md) for explanations of `doPost` not found, Unauthorized, HTTP 405, HTTP 502, and missing email.

## Security and quotas

- Never expose the webhook secret to visitors.
- Only the Apps Script owner account sends mail.
- Gmail sending quotas and Google account restrictions apply.
- Do not submit real customer details during repeated diagnostics; use a controlled test address.
