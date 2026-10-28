const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(
  path.join(__dirname, "..", "custom-software-development-tanzania.html"),
  "utf8"
);

function readJsonLd() {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert.ok(match, "service landing page must include JSON-LD");
  return JSON.parse(match[1]);
}

test("service landing page targets website and custom software searches in Tanzania", () => {
  assert.match(html, /<title>Website &amp; Custom Software Development in Tanzania \| JOHN ONLINE SERVICES<\/title>|<title>Website & Custom Software Development in Tanzania \| JOHN ONLINE SERVICES<\/title>/);
  assert.match(html, /<h1>Website & custom software development <em>in Tanzania\.<\/em><\/h1>/);
  assert.match(html, /Website development and custom software development in Tanzania/);
  assert.match(html, /business websites, web applications and custom management systems/);
  assert.match(html, /POS, ERP & inventory management software/);
});

test("service structured data describes the website and software development offer", () => {
  const graph = readJsonLd()["@graph"];
  const service = graph.find((node) => node["@type"] === "Service");
  assert.ok(service, "page must expose a Service entity");
  assert.equal(service.name, "Website and Custom Software Development in Tanzania");
  for (const phrase of ["Website development", "Web application development", "Custom software development", "POS and ERP systems"]) {
    assert.ok(service.serviceType.includes(phrase), "service schema must include " + phrase);
  }
  assert.equal(service.areaServed?.name, "Tanzania");
});

test("service landing page provides direct, descriptive project enquiry routes", () => {
  assert.match(html, /wa\.me\/255698170989\?text=/);
  assert.match(html, /Get a project quote on WhatsApp/);
  assert.match(html, /href="\.\/contact\.html"/);
  assert.match(html, /Start a WhatsApp project enquiry/);
  assert.match(html, /href="\.\/projects\.html"/);
});
