# Portfolio conversion tracking

## Current implementation

The shared `analytics.js` script queues these custom events in `window.dataLayer`:

- `jos_whatsapp_click` — a visitor clicks a WhatsApp link.
- `jos_email_click` — a visitor clicks an email link.
- `jos_phone_click` — a visitor clicks a telephone link.
- `jos_project_form_submit` — a visitor submits the project enquiry form (submission intent, not proof of successful delivery).

Each event includes `page_path`; contact-click events also include `link_url`.

## Important: events are not yet sent to Google

No Google Analytics measurement ID or Google Tag Manager container ID was present when this instrumentation was added. The script therefore queues events locally in `window.dataLayer` and makes no third-party analytics request. It does not claim to provide reporting until a tag manager or analytics destination is connected.

## Connect Google Tag Manager

1. Create or open the site's Google Tag Manager web container.
2. Add the official GTM container snippet to the site using the container ID supplied by Google.
3. Create Custom Event triggers with these exact event names: `jos_whatsapp_click`, `jos_email_click`, `jos_phone_click`, and `jos_project_form_submit`.
4. Connect those triggers to GA4 Event tags. Use event names such as `whatsapp_click`, `email_click`, `phone_click`, and `generate_lead`.
5. Preview the container, test each contact link and the enquiry form, then publish the container.
6. Mark the appropriate GA4 event as a key event after confirming it appears in reports.

Do not treat `jos_project_form_submit` as a confirmed lead: it records the form submission attempt. The website's API response is the source of truth for whether the request was accepted.

## Google Search Console

The homepage already contains a Google site verification meta tag. After signing into the verified Search Console property, submit:

`https://john-charles-sarwi-portfolio.vercel.app/sitemap.xml`

Then inspect the homepage, the Tanzania developer profile page and the custom software service page. Search Console indexing and performance data must be checked in the account; a successful deployment does not prove Google has indexed a URL.
