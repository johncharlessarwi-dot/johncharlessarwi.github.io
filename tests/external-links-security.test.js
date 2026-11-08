const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

test("external new-tab links cannot access opener windows", () => {
  for (const filename of fs.readdirSync(root).filter((file) => file.endsWith(".html"))) {
    const source = fs.readFileSync(path.join(root, filename), "utf8");
    const anchors = source.match(/<a\\b[^>]*>/gi) || [];
    for (const anchor of anchors) {
      if (!/target=["']_blank["']/i.test(anchor)) continue;
      assert.match(anchor, /rel=["'][^"']*(?:noopener|noreferrer)/i, filename + ": " + anchor);
    }
  }
});
