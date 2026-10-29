# John Charles Sarwi — Developer Portfolio

A responsive developer portfolio with GitHub project discovery, public activity, a GitHub Actions delivery activity feed, and a project enquiry form.

**Website:** https://john-charles-sarwi-portfolio.vercel.app/  
**GitHub:** https://github.com/johncharlessarwi-dot

## Features

- Responsive dark interface with mobile navigation.
- Public GitHub profile statistics, repository discovery, and recent activity.
- Featured projects, searchable project cards, and category filters.
- Project changelog linking to public commits.
- Public GitHub Actions delivery activity, including workflow status and commit links.
- Project enquiry form with server-side validation, a honeypot, and unique order references.
- Google Apps Script + Gmail order notifications and customer acknowledgement.
- SEO metadata and reduced-motion support.

## Professional focus

The portfolio serves two audiences:

- **International software career:** engineering roles, internships, remote opportunities, and technical collaborations.
- **JOHN ONLINE SERVICES AND APPLICATIONS:** websites, custom business systems, POS/ERP solutions, and AI-enabled workflow automation.

## Stack

HTML, CSS, vanilla JavaScript, GitHub REST API, Vercel Node.js Functions, Google Apps Script, and Gmail.

## Featured public repositories

These repositories provide publicly accessible source-code examples from my software work:

- [SafeNet — RADIUS and network access management](https://github.com/johncharlessarwi-dot/safe-net)
- [Campus Connect — university information platform](https://github.com/johncharlessarwi-dot/campusconnectapp)
- [SmartVote Platform — digital election workflows](https://github.com/johncharlessarwi-dot/smartvote-platform)
- [PHARMAFLOW — pharmacy management system](https://github.com/johncharlessarwi-dot/PHARMACEUTICAL-MANAGEMENT-SYSYTEM)
- [MWECAU DigiVote — Laravel-based voting platform](https://github.com/johncharlessarwi-dot/mwecau_digivote_laravel)

For current live products, selected case studies and project enquiries, visit the [official portfolio](https://john-charles-sarwi-portfolio.vercel.app/).

## Run locally

Open `index.html` to inspect the static interface. Vercel serverless endpoints under `/api` require Vercel environment variables and are not provided by opening the HTML file directly.

Run the API tests with Node.js 20 or newer:

```bash
node --test tests/*.test.js
```

## Required Vercel environment variables

Configure these in Vercel Project Settings → Environment Variables. Keep all values server-side and never commit secrets.

| Variable | Purpose |
| --- | --- |
| `GOOGLE_APPS_SCRIPT_URL` | Deployed Google Apps Script Web App URL ending in `/exec`. |
| `ORDER_WEBHOOK_SECRET` | Shared secret used to authenticate Vercel-to-Apps-Script requests. |

After changing Vercel environment variables, redeploy the project. The Apps Script project must separately store the same `ORDER_WEBHOOK_SECRET` in Script properties. The optional `ORDER_INBOX` property controls the notification destination; the default is `johncharlessarwi@gmail.com`.

## Order email delivery

The browser submits order details to `/api/contact`. The server validates the request, generates a `JOS-YYYYMMDD-XXXXX` reference, and forwards the payload to Google Apps Script. Apps Script validates the shared secret, sends a detailed notification to the business inbox, and sends an acknowledgement to the customer.

The form must not show a successful order state unless the Apps Script response contains `ok: true`. The endpoint uses a server-side secret; it must never be exposed in frontend assets.

### Setup and troubleshooting

- [Order email deployment setup](docs/ORDER_EMAIL_SETUP.md)
- [Order email troubleshooting and error recovery](docs/ORDER_EMAIL_TROUBLESHOOTING.md)
- [Delivery activity feed documentation](docs/DELIVERY_ACTIVITY_FEED.md)
- [API tests](tests/contact-api.test.js)

A successful API response means the server-side handler accepted the mail script's success response. Confirm actual receipt in the relevant Inbox/Spam folders before declaring end-to-end email delivery verified.

## GitHub data

The portfolio uses public GitHub endpoints for profile statistics, public repositories, and public events. Unauthenticated API rate limits apply. Private repositories and private activity are not exposed.

## Delivery activity feed

The server-side `/api/deployments` endpoint reads public GitHub Actions workflow-run metadata. No API token is required. The panel reports CI/CD workflow activity and links to each run; it is not a complete Vercel production deployment history.

## Add featured projects

Edit the `featured` array in `app.js`. Other public repositories are discovered automatically.

© John Charles Sarwi
