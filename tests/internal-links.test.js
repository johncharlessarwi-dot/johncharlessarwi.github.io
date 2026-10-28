const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const htmlFiles = fs
  .readdirSync(root)
  .filter((file) => file.endsWith(".html"));

const pages = new Map(
  htmlFiles.map((file) => [
    file,
    fs.readFileSync(path.join(root, file), "utf8")
  ])
);

function collectAnchors(html) {
  return new Set(
    [...html.matchAll(/\b(?:id|name)=["']([^"']+)["']/gi)].map(
      (match) => match[1]
    )
  );
}

test("all local HTML links point to existing portfolio pages and anchors", () => {
  const anchorsByPage = new Map(
    [...pages].map(([file, html]) => [file, collectAnchors(html)])
  );
  const brokenLinks = [];

  for (const [source, html] of pages) {
    for (const match of html.matchAll(/\bhref=["']([^"']+)["']/gi)) {
      const href = match[1].trim();
      if (
        !href ||
        href.startsWith("#") ||
        /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)
      ) {
        continue;
      }

      const url = new URL(href, \`https://portfolio.local/\${source}\`);
      if (url.origin !== "https://portfolio.local") continue;

      let pathname;
      try {
        pathname = decodeURIComponent(url.pathname);
      } catch {
        brokenLinks.push(\`\${source}: invalid URL encoding in \${href}\`);
        continue;
      }

      if (pathname.endsWith("/")) pathname += "index.html";
      if (!pathname.endsWith(".html")) continue;

      const target = pathname.replace(/^\/+/, "");
      if (!pages.has(target)) {
        brokenLinks.push(\`\${source}: missing page \${href}\`);
        continue;
      }

      if (
        url.hash &&
        !anchorsByPage.get(target).has(decodeURIComponent(url.hash.slice(1)))
      ) {
        brokenLinks.push(\`\${source}: missing anchor \${href}\`);
      }
    }
  }

  assert.deepEqual(brokenLinks, [], brokenLinks.join("\n"));
});

test("core portfolio pages expose links to the main navigation destinations", () => {
  const requiredDestinations = [
    "./index.html",
    "./about.html",
    "./projects.html",
    "./services.html",
    "./resume.html",
    "./contact.html"
  ];

  for (const page of [
    "about.html",
    "projects.html",
    "services.html",
    "resume.html",
    "contact.html"
  ]) {
    const html = pages.get(page);
    assert.ok(html, \`\${page} must exist\`);

    for (const destination of requiredDestinations) {
      assert.ok(
        html.includes(\`href="\${destination}"\`),
        \`\${page} should link to \${destination}\`
      );
    }
  }
});
