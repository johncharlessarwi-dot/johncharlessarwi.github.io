const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith(".html"));

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map((match) => [
      match[1].toLowerCase(),
      match[2]
    ])
  );
}

test("HTML images have alt attributes and local sources exist", () => {
  const failures = [];

  for (const file of htmlFiles) {
    const html = fs.readFileSync(path.join(root, file), "utf8");

    for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
      const attrs = attributes(match[0]);
      const src = attrs.src;

      if (!Object.hasOwn(attrs, "alt")) {
        failures.push(file + ": image is missing an alt attribute (" + (src || "no src") + ")");
      }

      if (!src || /^(?:[a-z][a-z\d+.-]*:|\/\/|data:)/i.test(src)) continue;

      const localPath = path.resolve(root, decodeURIComponent(src.split(/[?#]/)[0]));
      if (!localPath.startsWith(root + path.sep) && localPath !== root) {
        failures.push(file + ": image source escapes repository root (" + src + ")");
      } else if (!fs.existsSync(localPath)) {
        failures.push(file + ": missing local image " + src);
      }
    }
  }

  assert.deepEqual(failures, [], failures.join("\n"));
});

test("portfolio hero images are eager while carousel images are deferred", () => {
  const html = fs.readFileSync(path.join(root, "portfolio.html"), "utf8");
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => attributes(match[0]));

  assert.equal(images.length, 4, "portfolio page should retain its four image elements");

  const [heroPrimary, heroSecondary, carouselPrimary, carouselSecondary] = images;

  assert.equal(heroPrimary.src, "IMG_20251228_164915_1.jpg");
  assert.equal(heroSecondary.src, "IMG_20251228_164918.jpg");
  assert.equal(heroPrimary.fetchpriority, "high");
  assert.notEqual(heroPrimary.loading, "lazy");
  assert.notEqual(heroSecondary.loading, "lazy");

  for (const image of [carouselPrimary, carouselSecondary]) {
    assert.equal(image.loading, "lazy");
    assert.equal(image.decoding, "async");
    assert.equal(image.width, "400");
    assert.equal(image.height, "400");
    assert.equal(image.alt, "", "stock carousel images are decorative, not John’s portraits");
  }
});
