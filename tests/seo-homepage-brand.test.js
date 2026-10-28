const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");

test("homepage clearly identifies John Charles Sarwi as a Tanzania-based software developer", () => {
  assert.match(html, /<title>John Charles Sarwi \| Full-Stack Software Developer in Tanzania<\/title>/);
  assert.match(html, /<meta name="author" content="John Charles Sarwi">/);
  assert.match(html, /<meta property="profile:first_name" content="John">/);
  assert.match(html, /<meta property="profile:last_name" content="Sarwi">/);
  assert.match(html, /<h1>John Charles Sarwi<br><em>Software Developer in Tanzania\.<\/em><\/h1>/);
});

test("homepage preserves its canonical URL and Person structured data", () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/john-charles-sarwi-portfolio\.vercel\.app\/">/);
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert.ok(match, "homepage must include JSON-LD");
  const graph = JSON.parse(match[1])["@graph"];
  const person = graph.find((item) => item["@type"] === "Person");
  assert.equal(person?.name, "John Charles Sarwi");
  assert.equal(person?.url, "https://john-charles-sarwi-portfolio.vercel.app/");
});
