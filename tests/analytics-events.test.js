const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const analytics = fs.readFileSync(path.join(root, "analytics.js"), "utf8");

test("analytics queues WhatsApp, email and phone contact events", () => {
  assert.match(analytics, /jos_whatsapp_click/);
  assert.match(analytics, /jos_email_click/);
  assert.match(analytics, /jos_phone_click/);
});

test("analytics records project enquiry form submission intent", () => {
  assert.match(analytics, /jos_project_form_submit/);
  assert.match(analytics, /project-form/);
});

test("analytics is privacy-conscious and does not hardcode vendor IDs", () => {
  assert.match(analytics, /window\.dataLayer = window\.dataLayer \|\| \[\]/);
  assert.doesNotMatch(analytics, /G-[A-Z0-9]{6,}|GTM-[A-Z0-9]+/);
  assert.doesNotMatch(analytics, /document\.cookie|localStorage|sessionStorage/);
});
