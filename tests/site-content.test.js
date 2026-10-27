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

test("sitemap includes all public portfolio pages", () => {
  const sitemap = read("sitemap.xml");
  for (const page of ["/", "/about.html", "/projects.html", "/services.html", "/resume.html", "/contact.html", "/bizflow-ai.html"]) {
    assert.ok(sitemap.includes("https://john-charles-sarwi-portfolio.vercel.app" + page), page + " must be discoverable");
    const urlBlock = sitemap.split("<url>").find(block => block.includes("<loc>https://john-charles-sarwi-portfolio.vercel.app" + page + "</loc>"));
    assert.ok(urlBlock, page + " must have a sitemap URL block");
    assert.match(urlBlock, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/, page + " must include a valid last-modified date");
  }
});


test("all primary pages expose an accessible, working shared mobile navigation", () => {
  const pages = ["index.html", "about.html", "projects.html", "services.html", "contact.html"];
  for (const page of pages) {
    const html = read(page);
    assert.ok(html.includes('id="menu"'), page + " must include the menu control");
    assert.ok(html.includes('aria-controls="nav"'), page + " must connect the menu to navigation");
    assert.ok(html.includes('aria-expanded="false"'), page + " must expose the collapsed state");
    assert.ok(html.includes('./navigation.js'), page + " must load shared navigation behavior");
  }
  const navigation = read("navigation.js");
  assert.ok(navigation.includes('event.key === "Escape"'));
  assert.ok(navigation.includes('menu.setAttribute("aria-expanded"'));
  assert.ok(navigation.includes('link.addEventListener("click"'));
});

test("tablet navigation collapses before the desktop header becomes crowded", () => {
  const css = read("styles.css");
  assert.ok(css.includes("@media(max-width:680px)"));
  assert.ok(css.includes("nav.open{display:flex}"));
});


test("mobile layout keeps the hero visual and form controls usable on narrow screens", () => {
  const css = read("styles.css");
  assert.ok(css.includes(".visual{width:100%;max-width:420px;height:340px"));
  assert.ok(css.includes(".profile{width:min(300px,calc(100% - 28px))"));
  assert.ok(css.includes(".form-grid input,.form-grid select,.form-grid textarea{font-size:16px"));
  assert.ok(css.includes("#search{width:100%;font-size:16px"));
});

test("keyboard focus and mobile navigation controls have visible accessible targets", () => {
  const css = read("styles.css");
  assert.ok(css.includes(":focus-visible"));
  assert.ok(css.includes("nav a{min-height:44px"));
  assert.ok(css.includes("#menu{min-width:44px;min-height:44px"));
});


test("homepage publishes valid person, organisation and website structured data", () => {
  const html = read("index.html");
  const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(block, "homepage must include JSON-LD structured data");
  const data = JSON.parse(block[1]);
  assert.equal(data["@context"], "https://schema.org");
  assert.ok(data["@graph"].some(item => item["@type"] === "Person" && item.name === "John Charles Sarwi"));
  assert.ok(data["@graph"].some(item => item["@type"] === "Organization" && item.name === "JOHN ONLINE SERVICES AND APPLICATIONS"));
  assert.ok(data["@graph"].some(item => item["@type"] === "WebSite"));
});

test("homepage includes canonical, Open Graph image and Twitter sharing metadata", () => {
  const html = read("index.html");
  assert.ok(html.includes('<link rel="canonical" href="https://john-charles-sarwi-portfolio.vercel.app/">'));
  assert.ok(html.includes('property="og:image"'));
  assert.ok(html.includes('name="twitter:card"'));
  assert.ok(html.includes('name="description"'));
});


test("every indexable portfolio page has a unique canonical and social preview metadata", () => {
  const pages = ["index.html", "about.html", "projects.html", "services.html", "resume.html", "contact.html", "bizflow-ai.html"];
  const canonicals = [];
  for (const page of pages) {
    const html = read(page);
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
    assert.ok(canonical, page + " must declare a canonical URL");
    assert.ok(html.includes('property="og:title"'), page + " must declare an Open Graph title");
    assert.ok(html.includes('property="og:description"'), page + " must declare an Open Graph description");
    assert.ok(html.includes('property="og:image"'), page + " must declare an Open Graph image");
    assert.ok(html.includes('name="twitter:card"'), page + " must declare a Twitter card");
    canonicals.push(canonical[1]);
  }
  assert.equal(new Set(canonicals).size, pages.length, "canonical URLs must be unique per page");
});

test("robots.txt allows public crawling and points to the portfolio sitemap", () => {
  const robots = read("robots.txt");
  assert.ok(robots.includes("User-agent: *"));
  assert.ok(robots.includes("Allow: /"));
  assert.ok(robots.includes("Sitemap: https://john-charles-sarwi-portfolio.vercel.app/sitemap.xml"));
});

test("homepage prioritizes its profile image and preconnects the font asset origin", () => {
  const html = read("index.html");
  assert.ok(html.includes('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'));
  assert.ok(html.includes('alt="John Charles Sarwi" width="76" height="76" fetchpriority="high" decoding="async"'));
});

test("secondary pages publish valid page and breadcrumb structured data", () => {
  const pages = ["about.html", "projects.html", "services.html", "resume.html", "contact.html", "bizflow-ai.html"];
  for (const page of pages) {
    const html = read(page);
    const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(block, page + " must include JSON-LD structured data");
    const data = JSON.parse(block[1]);
    assert.equal(data["@context"], "https://schema.org");
    assert.ok(data["@graph"].some(item => ["WebPage", "AboutPage", "ContactPage"].includes(item["@type"])), page + " must describe the page");
    const breadcrumb = data["@graph"].find(item => item["@type"] === "BreadcrumbList");
    assert.ok(breadcrumb, page + " must include breadcrumb structured data");
    assert.equal(breadcrumb.itemListElement.at(-1).item, html.match(/<link rel="canonical" href="([^"]+)"/)[1]);
  }
});
