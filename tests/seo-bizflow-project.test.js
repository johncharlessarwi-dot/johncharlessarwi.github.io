const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(
  path.join(__dirname, "..", "bizflow-ai.html"),
  "utf8"
);

function readJsonLd() {
  const match = html.match(
    /<script type="application\\/ld\\+json">([\\s\\S]*?)<\\/script>/i
  );
  assert.ok(match, "bizflow-ai.html must include a JSON-LD script");
  return JSON.parse(match[1]);
}

test("BizFlow AI case study identifies its main project entity", () => {
  const graph = readJsonLd()["@graph"];
  const page = graph.find((node) => node["@type"] === "WebPage");
  const project = graph.find((node) => node["@type"] === "Project");

  assert.ok(page, "case study must include a WebPage entity");
  assert.ok(project, "case study must include a Project entity");
  assert.equal(
    page.mainEntity?.["@id"],
    "https://john-charles-sarwi-portfolio.vercel.app/bizflow-ai.html#project"
  );
  assert.equal(project.name, "BizFlow AI");
  assert.equal(project.url, "https://bizflow-ai-xi.vercel.app/");
  assert.equal(
    project.creator?.["@id"],
    "https://john-charles-sarwi-portfolio.vercel.app/#john-charles-sarwi"
  );
  assert.equal(
    project.mainEntityOfPage?.["@id"],
    "https://john-charles-sarwi-portfolio.vercel.app/bizflow-ai.html#webpage"
  );
});

test("BizFlow AI project schema preserves the existing breadcrumb", () => {
  const graph = readJsonLd()["@graph"];
  const breadcrumb = graph.find((node) => node["@type"] === "BreadcrumbList");

  assert.ok(breadcrumb, "case study must retain its breadcrumb structured data");
  assert.equal(breadcrumb.itemListElement?.length, 2);
});
