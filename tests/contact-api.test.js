const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/contact");

function responseRecorder() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

function validRequest(overrides = {}) {
  return {
    method: "POST",
    body: {
      name: "Test Customer",
      email: "customer@example.com",
      service: "Website development",
      message: "I need a responsive website for my business.",
      ...overrides
    }
  };
}

async function callHandler(req) {
  const res = responseRecorder();
  await handler(req, res);
  return res;
}

test("rejects methods other than POST", async () => {
  const res = await callHandler({ method: "GET" });
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "POST");
});

test("rejects invalid or incomplete enquiries", async () => {
  const res = await callHandler(validRequest({ email: "not-an-email" }));
  assert.equal(res.statusCode, 400);
  assert.match(res.body.error, /valid name, email, service/);
});

test("honeypot submissions are quietly discarded without forwarding", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => { throw new Error("fetch must not run"); };
  try {
    const res = await callHandler(validRequest({ website: "spam-link.example" }));
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { ok: true });
  } finally {
    global.fetch = originalFetch;
  }
});

test("reports missing Apps Script URL", async () => {
  const oldUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const oldSecret = process.env.ORDER_WEBHOOK_SECRET;
  delete process.env.GOOGLE_APPS_SCRIPT_URL;
  process.env.ORDER_WEBHOOK_SECRET = "test-secret";
  try {
    const res = await callHandler(validRequest());
    assert.equal(res.statusCode, 503);
  } finally {
    if (oldUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_URL;
    else process.env.GOOGLE_APPS_SCRIPT_URL = oldUrl;
    if (oldSecret === undefined) delete process.env.ORDER_WEBHOOK_SECRET;
    else process.env.ORDER_WEBHOOK_SECRET = oldSecret;
  }
});

test("reports missing webhook secret instead of sending unsigned orders", async () => {
  const oldUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const oldSecret = process.env.ORDER_WEBHOOK_SECRET;
  process.env.GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/test-deployment/exec";
  delete process.env.ORDER_WEBHOOK_SECRET;
  try {
    const res = await callHandler(validRequest());
    assert.equal(res.statusCode, 503);
  } finally {
    if (oldUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_URL;
    else process.env.GOOGLE_APPS_SCRIPT_URL = oldUrl;
    if (oldSecret === undefined) delete process.env.ORDER_WEBHOOK_SECRET;
    else process.env.ORDER_WEBHOOK_SECRET = oldSecret;
  }
});

test("returns a cryptographically random order reference only when Apps Script accepts the order", async () => {
  const oldUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const oldSecret = process.env.ORDER_WEBHOOK_SECRET;
  const originalFetch = global.fetch;
  process.env.GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/test-deployment/exec";
  process.env.ORDER_WEBHOOK_SECRET = "test-secret-only";
  let forwarded;
  global.fetch = async (url, options) => {
    forwarded = { url, options, payload: JSON.parse(options.body) };
    return new Response(JSON.stringify({ ok: true, orderId: forwarded.payload.orderId }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  };
  try {
    const res = await callHandler(validRequest({ message: "First paragraph about the website.\nSecond paragraph about booking." }));
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.match(forwarded.payload.message, /website\.\nSecond paragraph/);
    assert.match(res.body.orderId, /^JOS-\d{8}-[A-F0-9]{8}$/);
    assert.equal(forwarded.url, "https://script.google.com/macros/s/test-deployment/exec");
    assert.equal(forwarded.options.method, "POST");
    assert.equal(forwarded.options.redirect, "follow");
    assert.equal(forwarded.payload.secret, "test-secret-only");
    assert.equal(forwarded.payload.email, "customer@example.com");
  } finally {
    global.fetch = originalFetch;
    if (oldUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_URL;
    else process.env.GOOGLE_APPS_SCRIPT_URL = oldUrl;
    if (oldSecret === undefined) delete process.env.ORDER_WEBHOOK_SECRET;
    else process.env.ORDER_WEBHOOK_SECRET = oldSecret;
  }
});

test("does not report success when Apps Script rejects the order", async () => {
  const oldUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const oldSecret = process.env.ORDER_WEBHOOK_SECRET;
  const originalFetch = global.fetch;
  process.env.GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/test-deployment/exec";
  process.env.ORDER_WEBHOOK_SECRET = "test-secret-only";
  global.fetch = async () => new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
    status: 200, headers: { "content-type": "application/json" }
  });
  try {
    const res = await callHandler(validRequest());
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.ok, undefined);
  } finally {
    global.fetch = originalFetch;
    if (oldUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_URL;
    else process.env.GOOGLE_APPS_SCRIPT_URL = oldUrl;
    if (oldSecret === undefined) delete process.env.ORDER_WEBHOOK_SECRET;
    else process.env.ORDER_WEBHOOK_SECRET = oldSecret;
  }
});

test("converts upstream network failures into a safe 502 response", async () => {
  const oldUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const oldSecret = process.env.ORDER_WEBHOOK_SECRET;
  const originalFetch = global.fetch;
  const originalConsoleError = console.error;
  const logMessages = [];
  process.env.GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/test-deployment/exec";
  process.env.ORDER_WEBHOOK_SECRET = "test-secret-only";
  global.fetch = async () => { throw new Error("private upstream diagnostic"); };
  console.error = (...args) => logMessages.push(args.join(" "));
  try {
    const res = await callHandler(validRequest());
    assert.equal(res.statusCode, 502);
    assert.doesNotMatch(JSON.stringify(res.body), /private upstream diagnostic/);
    assert.equal(logMessages.length, 1);
    assert.match(logMessages[0], /Order email delivery failed/);
    assert.doesNotMatch(logMessages.join(" "), /private upstream diagnostic/);
  } finally {
    console.error = originalConsoleError;
    global.fetch = originalFetch;
    if (oldUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_URL;
    else process.env.GOOGLE_APPS_SCRIPT_URL = oldUrl;
    if (oldSecret === undefined) delete process.env.ORDER_WEBHOOK_SECRET;
    else process.env.ORDER_WEBHOOK_SECRET = oldSecret;
  }
});

test("outbound order delivery has a finite timeout", () => {
  const source = require("node:fs").readFileSync(require("node:path").join(__dirname, "../api/contact.js"), "utf8");
  assert.match(source, /signal:\s*AbortSignal\.timeout\(8000\)/);
});

test("rejects object-valued form fields instead of coercing them", async () => {
  const res = await callHandler(validRequest({ name: { unexpected: "payload" } }));
  assert.equal(res.statusCode, 400);
});

test("control characters in email addresses are rejected", async () => {
  const res = await callHandler(validRequest({ email: "customer\n@example.com" }));
  assert.equal(res.statusCode, 400);
});

test("does not disclose webhook secret to unapproved destinations", async () => {
  const oldUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const oldSecret = process.env.ORDER_WEBHOOK_SECRET;
  const originalFetch = global.fetch;
  process.env.GOOGLE_APPS_SCRIPT_URL = "https://untrusted.example/collect";
  process.env.ORDER_WEBHOOK_SECRET = "sensitive-test-secret";
  global.fetch = async () => { throw new Error("must never send secret"); };
  try {
    const res = await callHandler(validRequest());
    assert.equal(res.statusCode, 503);
  } finally {
    global.fetch = originalFetch;
    if (oldUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_URL;
    else process.env.GOOGLE_APPS_SCRIPT_URL = oldUrl;
    if (oldSecret === undefined) delete process.env.ORDER_WEBHOOK_SECRET;
    else process.env.ORDER_WEBHOOK_SECRET = oldSecret;
  }
});

test("rejects explicitly unsupported form content types", async () => {
  const req = validRequest();
  req.headers = { "content-type": "text/plain" };
  const res = await callHandler(req);
  assert.equal(res.statusCode, 415);
});

test("accepts JSON requests with charset parameters", async () => {
  const req = validRequest({ email: "invalid" });
  req.headers = { "content-type": "application/json; charset=utf-8" };
  const res = await callHandler(req);
  assert.equal(res.statusCode, 400);
});

test("rejects mismatched webhook delivery acknowledgement IDs", async () => {
  const oldUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const oldSecret = process.env.ORDER_WEBHOOK_SECRET;
  const originalFetch = global.fetch;
  process.env.GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/test-deployment/exec";
  process.env.ORDER_WEBHOOK_SECRET = "test-secret";
  global.fetch = async () => new Response(JSON.stringify({ ok: true, orderId: "OTHER-ORDER" }), { status: 200 });
  try {
    const res = await callHandler(validRequest());
    assert.equal(res.statusCode, 502);
  } finally {
    global.fetch = originalFetch;
    if (oldUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_URL;
    else process.env.GOOGLE_APPS_SCRIPT_URL = oldUrl;
    if (oldSecret === undefined) delete process.env.ORDER_WEBHOOK_SECRET;
    else process.env.ORDER_WEBHOOK_SECRET = oldSecret;
  }
});


test("rejects oversized declared request bodies before forwarding", async () => {
  const req = validRequest();
  req.headers = { "content-length": String(16 * 1024 + 1) };
  const res = await callHandler(req);
  assert.equal(res.statusCode, 413);
});

test("rejects oversized raw JSON before parsing", async () => {
  const req = validRequest();
  req.body = "x".repeat(16 * 1024 + 1);
  const res = await callHandler(req);
  assert.equal(res.statusCode, 413);
});

test("does not confuse Unicode character count with body byte size", async () => {
  const req = validRequest();
  req.body = "😊".repeat(4200);
  const res = await callHandler(req);
  assert.equal(res.statusCode, 413);
});


test("rejects oversized parsed object payloads", async () => {
  const res = await callHandler(validRequest({ extra: "x".repeat(20 * 1024) }));
  assert.equal(res.statusCode, 413);
});

test("rejects unserializable cyclic object payloads safely", async () => {
  const req = validRequest();
  req.body.self = req.body;
  const res = await callHandler(req);
  assert.equal(res.statusCode, 400);
});


test("rejects directional override tricks in customer fields", async () => {
  for (const field of ["name", "email", "phone", "service", "message"]) {
    const res = await callHandler(validRequest({ [field]: "Example" + String.fromCharCode(0x202E) + "hidden" }));
    assert.equal(res.statusCode, 400, field);
  }
});


test("rejects overlong optional enquiry fields instead of silently truncating", async () => {
  for (const [field, length] of Object.entries({ phone: 41, company: 121, budget: 101, timeline: 101, contactPreference: 41 })) {
    const res = await callHandler(validRequest({ [field]: "x".repeat(length) }));
    assert.equal(res.statusCode, 413, field);
  }
});
