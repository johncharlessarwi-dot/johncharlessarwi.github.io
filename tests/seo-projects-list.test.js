const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(
  path.join(__dirname, "..", "projects.html"),
  "utf8"
);

function readJsonLd() {
  const match = html.match(
    /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i
  );
  assert.ok(match, "projects.html must include a JSON-LD script");
  return JSON.parse(match[1]);
}

test("projects page exposes an ordered list of eight portfolio projects", () => {
  const graph = readJsonLd()["@graph"];
  const page = graph.find((node) => node["@type"] === "WebPage");
  const list = graph.find((node) => node["@type"] === "ItemList");

  assert.ok(page, "projects page must include a WebPage entity");
  assert.ok(list, "projects page must include an ItemList entity");
  assert.equal(
    page.mainEntity?.["@id"],
    "https://john-charles-sarwi-portfolio.vercel.app/projects.html#project-list"
  );
  assert.equal(list.numberOfItems, 8);
  assert.equal(list.itemListElement.length, 8);
  assert.deepEqual(
    list.itemListElement.map((entry) => entry.position),
    [1, 2, 3, 4, 5, 6, 7, 8]
  );
  assert.deepEqual(
    list.itemListElement.map((entry) => entry.item.name),
    [
      "BizFlow AI",
      "WPMS Pharmacy ERP",
      "Bhoke Agrovet",
      "FIMA Microfinance",
      "JOHN JOBCRAFT AI",
      "SafeNet",
      "Campus Connect",
      "Agentic Tourism Platform"
    ]
  );
  assert.ok(
    list.itemListElement.every(
      (entry) =>
        entry.item.creator?.["@id"] ===
        "https://john-charles-sarwi-portfolio.vercel.app/#john-charles-sarwi"
    ),
    "every listed project must reference the canonical creator entity"
  );
});

test("projects page retains its breadcrumb structured data", () => {
  const graph = readJsonLd()["@graph"];
  const breadcrumb = graph.find((node) => node["@type"] === "BreadcrumbList");

  assert.ok(breadcrumb, "projects page must retain breadcrumb structured data");
  assert.equal(breadcrumb.itemListElement?.length, 2);
});
