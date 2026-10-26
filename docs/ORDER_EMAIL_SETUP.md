# Order email setup — Google Apps Script (no Resend)

The portfolio sends orders through Google Apps Script. Gmail delivers a detailed notification to the business inbox and an acknowledgement to the customer.

## Create the mail handler
1. Sign in to the Google account that should send order emails.
2. Open https://script.google.com/ and create a standalone project.
3. Copy the contents of google-apps-script/Code.gs in this repository into the Apps Script editor.
4. Open Project Settings → Script properties and add:
   - ORDER_WEBHOOK_SECRET: a long random secret (at least 32 characters).
   - ORDER_INBOX: johncharlessarwi@gmail.com (optional; this is the default).
5. Save the project.

## Deploy the web app
1. Select Deploy → New deployment → Web app.
2. Set Execute as to Me.
3. Set Who has access to Anyone.
4. Deploy and authorize the Gmail permissions.
5. Copy the deployed Web app URL ending in /exec.

## Configure Vercel
In the Vercel project john-charles-sarwi-portfolio, add Production environment variables:
- GOOGLE_APPS_SCRIPT_URL: the deployed /exec URL.
- ORDER_WEBHOOK_SECRET: exactly the same value saved in Apps Script.

Redeploy after saving the variables. Never place the secret in frontend code or commit it to Git.

## Test
Submit a real test request from the live portfolio. Confirm that:
- the business inbox receives the full order;
- the customer receives a confirmation email and order reference;
- the form displays the order reference.

The mail is sent by the Google account that deployed the Apps Script. Google account sending quotas apply. Until Vercel is configured, the form will clearly report that email delivery is not configured.
