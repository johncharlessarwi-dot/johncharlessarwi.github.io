# John Charles Sarwi — Developer Portfolio

A responsive developer portfolio with live GitHub repository discovery, public activity, a Vercel deployment feed and a project enquiry form.

**Website:** https://john-charles-sarwi-portfolio.vercel.app/  
**GitHub:** https://github.com/johncharlessarwi-dot

## Features
- Responsive premium dark interface with mobile navigation.
- Live GitHub profile statistics and public repository discovery.
- Featured projects with live demo links where available.
- Interactive project overview dialogs with repository details, technology tags, last-updated dates and source/live links.
- Search and category filters across public repositories.
- Recent public GitHub events, refreshed every five minutes.
- Per-project changelog showing the latest public commit message and commit link for each featured repository.
- Vercel deployment feed covering connected Vercel projects, showing project, deployment state, commit summary, branch and deployment URL.
- Project enquiry form for name, email, phone, organisation, service, budget and requirements.
- Server-side email delivery through Resend; fixed recipient defaults to the portfolio owner's inbox.
- Input validation, output escaping, honeypot field and safe server-side API credentials.
- SEO metadata and reduced-motion support.

## Dual-purpose positioning
The portfolio serves two distinct audiences from one professional profile:
- **International developer career:** software engineering roles, internships, remote opportunities and technical collaborations.
- **JOHN ONLINE SERVICES AND APPLICATIONS:** websites, custom business systems, POS/ERP solutions and AI-enabled workflow automation.

The home page provides separate career and business calls to action so visitors can follow the right enquiry path.

## Stack
HTML, CSS, vanilla JavaScript, GitHub REST API, Vercel Node.js Functions and Resend API.

## Run locally
Open `index.html` to inspect the static UI. The `/api` endpoints run on Vercel Functions and need their environment variables configured to provide live deployment data and email delivery.

## Required Vercel environment variables

Set these in Vercel Project Settings → Environment Variables. Never put secret values in frontend JavaScript or commit them to GitHub.

| Variable | Purpose |
| --- | --- |
| `VERCEL_API_TOKEN` | Secret token used server-side to read recent Vercel deployments |
| `VERCEL_TEAM_ID` | Optional team ID; defaults to the portfolio's connected team |
| `RESEND_API_KEY` | Resend API key used by the contact endpoint |
| `RESEND_FROM_EMAIL` | Sender address verified with Resend |
| `CONTACT_TO` | Optional destination; defaults to johncharlessarwi@gmail.com |

After adding or changing environment variables, redeploy the production project. For reliable delivery, verify a domain you control with Resend and use an address on that verified domain as `RESEND_FROM_EMAIL`. The form must not display a success state unless the email provider accepts the message.

## GitHub data
Uses public endpoints for the GitHub profile, public repositories and public events. GitHub applies unauthenticated rate limits. Private repositories and private activity are never exposed.

## Vercel deployment feed
The server-side `/api/deployments` function uses the Vercel REST API and a server-only token. It returns recent deployments visible to the configured Vercel team. If the token is missing or lacks access, the page explains that the feed needs configuration instead of inventing deployment data.

## Project enquiry email
The server-side `/api/contact` function validates incoming project enquiries and sends them through Resend to the configured inbox. The recipient is fixed by server configuration; visitors cannot choose the destination. The sender must be verified with Resend.

## Add featured projects
Edit the `featured` array in `app.js`. Remaining public repositories are discovered automatically.

© John Charles Sarwi
