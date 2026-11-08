const test = require("node:test");
const assert = require("node:assert/strict");
const config = require("../vercel.json");
const global = config.headers.find((entry) => entry.source === "/(.*)");
const headers = Object.fromEntries(global.headers.map(({key,value}) => [key.toLowerCase(), value]));

test("Vercel global security policy enforces HTTPS", () => {
  assert.match(headers["strict-transport-security"], /max-age=31536000/);
});

test("Vercel CSP prohibits framing and active plugin content", () => {
  assert.match(headers["content-security-policy"], /frame-ancestors 'none'/);
  assert.match(headers["content-security-policy"], /object-src 'none'/);
  assert.match(headers["content-security-policy"], /base-uri 'self'/);
});
