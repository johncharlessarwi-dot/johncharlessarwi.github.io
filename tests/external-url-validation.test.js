const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../app.js"), "utf8");
const declaration = source.split("\n").find((line) => line.startsWith("function safeExternalUrl("));
assert.ok(declaration, "safeExternalUrl helper must exist");
const safeUrl = vm.runInNewContext("(" + declaration.replace(/^function safeExternalUrl/, "function") + ")");

test("external URLs allow absolute HTTPS links", () => {
  assert.equal(safeUrl("https://github.com/johncharlessarwi-dot"), "https://github.com/johncharlessarwi-dot");
});

test("external URLs reject script and data schemes", () => {
  for (const input of ["javascript:alert(1)", "data:text/html,test", "http://example.com", "//example.com", "not a url"]) {
    assert.equal(safeUrl(input), null, input);
  }
});
