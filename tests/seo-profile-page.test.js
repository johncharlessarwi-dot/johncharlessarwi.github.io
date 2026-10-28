const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const aboutHtml = fs.readFileSync(
  path.join(__dirname, "..", "about.html"),
  "utf8"
);

function readJsonLd(html) {
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i
  );
  assert.ok(match, "about.html must include a JSON-LD script");
  return JSON.parse(match[1]);
}

test("about page exposes AboutPage and ProfilePage structured data", () => {
  const document = readJsonLd(aboutHtml);
  const graph = document["@graph"];
  assert.ok(Array.isArray(graph), "JSON-LD graph must be an array");

  const profile = graph.find((node) =>
    (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]])
      .includes("ProfilePage")
  );

  assert.ok(profile, "about page must be typed as ProfilePage");
  assert.ok(
    (Array.isArray(profile["@type"]) ? profile["@type"] : [profile["@type"]])
      .includes("AboutPage"),
    "profile page must retain its AboutPage type"
  );
  assert.equal(
    profile.mainEntity?.["@id"],
    "https://john-charles-sarwi-portfolio.vercel.app/#john-charles-sarwi",
    "ProfilePage mainEntity must reference the canonical Person entity"
  );
  assert.equal(
    profile.url,
    "https://john-charles-sarwi-portfolio.vercel.app/about.html"
  );
});

test("about page canonical URL matches its structured data URL", () => {
  const canonical = aboutHtml.match(
    /<link rel="canonical" href="([^"]+)"/i
  )?.[1];
  const document = readJsonLd(aboutHtml);
  const profile = document["@graph"].find((node) =>
    (Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]])
      .includes("ProfilePage")
  );

  assert.equal(canonical, profile?.url);
});

test("about page exposes consistent author and Open Graph profile metadata", () => {
  assert.match(aboutHtml, /<meta name="author" content="John Charles Sarwi">/);
  assert.match(aboutHtml, /<meta property="og:site_name" content="John Charles Sarwi">/);
  assert.match(aboutHtml, /<meta property="og:locale" content="en_TZ">/);
  assert.match(aboutHtml, /<meta property="profile:first_name" content="John">/);
  assert.match(aboutHtml, /<meta property="profile:last_name" content="Sarwi">/);
});
