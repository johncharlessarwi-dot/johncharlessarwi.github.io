const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("homepage navigation points to existing portfolio pages", () => {
  const html = read("index.html");
  for (const page of ["about.html", "projects.html", "services.html", "resume.html", "contact.html"]) {
    assert.ok(fs.existsSync(path.join(root, page)), page + " must exist");
    assert.ok(html.includes('./' + page), "homepage navigation must link to " + page);
  }
});

test("homepage has no literal escaped newline before activity content", () => {
  const html = read("index.html");
  assert.ok(!html.includes('\\n<section class="band" id="activity">'));
  assert.ok(html.includes('<section class="band" id="activity">'));
});

test("homepage section numbers are unique and sequential", () => {
  const html = read("index.html");
  const labels = [...html.matchAll(/<label>(0[1-7]) \/(?:[^<]+)<\/label>/g)].map(match => match[1]);
  assert.deepEqual(labels, ["01", "02", "03", "04", "05", "06", "07"]);
});

test("SafeNet links to the verified public repository slug", () => {
  const app = read("app.js");
  const projects = read("projects.html");
  assert.ok(app.includes('name:"safe-net"'));
  assert.ok(!app.includes('name:"safenet"'));
  assert.ok(projects.includes("https://github.com/johncharlessarwi-dot/safe-net"));
  assert.ok(!projects.includes("https://github.com/johncharlessarwi-dot/safenet"));
});

test("project page does not link directly to known private repositories", () => {
  const html = read("projects.html");
  for (const privateRepo of ["johncharlessarwi-dot/bizflow-ai", "johncharlessarwi-dot/wpms", "johncharlessarwi-dot/JOB-CRAFT-AGENTIC-AI"]) {
    assert.ok(!html.includes(privateRepo), privateRepo + " must not be presented as a public source link");
  }
});


test("resume does not publish an outdated expected graduation range", () => {
  const resume = read("resume.html");
  assert.ok(resume.includes("Currently enrolled"));
  assert.ok(!resume.includes("2024 – 2027 (Expected)"));
});


test("delivery panel accurately identifies GitHub Actions workflow activity", () => {
  const html = read("index.html");
  const app = read("app.js");
  const readme = read("README.md");
  assert.ok(html.includes("05 / DELIVERY ACTIVITY"));
  assert.ok(html.includes("Recent GitHub Actions workflow runs"));
  assert.ok(app.includes("LIVE GITHUB ACTIONS"));
  assert.ok(app.includes("View workflow"));
  assert.ok(!app.includes("No recent Vercel deployments"));
  assert.ok(readme.includes("No API token is required"));
});
\ntest("sitemap includes all public portfolio pages", () => {
  const sitemap = read("sitemap.xml");
  for (const page of ["/", "/about.html", "/projects.html", "/services.html", "/resume.html", "/contact.html", "/bizflow-ai.html"]) {
    assert.ok(sitemap.includes("https://john-charles-sarwi-portfolio.vercel.app" + page), page + " must be discoverable");
  }
});
