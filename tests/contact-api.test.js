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
  process.env.GOOGLE_APPS_SCRIPT_URL = "https://script.example/exec";
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

test("returns an order reference only when Apps Script accepts the order", async () => {
  const oldUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const oldSecret = process.env.ORDER_WEBHOOK_SECRET;
  const originalFetch = global.fetch;
  process.env.GOOGLE_APPS_SCRIPT_URL = "https://script.example/exec";
  process.env.ORDER_WEBHOOK_SECRET = "test-secret-only";
  let forwarded;
  global.fetch = async (url, options) => {
    forwarded = { url, options, payload: JSON.parse(options.body) };
    return new Response(JSON.stringify({ ok: true, orderId: forwarded.payload.orderId }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  };
  try {
    const res = await callHandler(validRequest());
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.ok, true);
    assert.match(res.body.orderId, /^JOS-\\d{8}-[A-F0-9]{8}$/);
    assert.equal(forwarded.url, "https://script.example/exec");
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
  process.env.GOOGLE_APPS_SCRIPT_URL = "https://script.example/exec";
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
  process.env.GOOGLE_APPS_SCRIPT_URL = "https://script.example/exec";
  process.env.ORDER_WEBHOOK_SECRET = "test-secret-only";
  global.fetch = async () => { throw new Error("private upstream diagnostic"); };
  try {
    const res = await callHandler(validRequest());
    assert.equal(res.statusCode, 502);
    assert.doesNotMatch(JSON.stringify(res.body), /private upstream diagnostic/);
  } finally {
    global.fetch = originalFetch;
    if (oldUrl === undefined) delete process.env.GOOGLE_APPS_SCRIPT_URL;
    else process.env.GOOGLE_APPS_SCRIPT_URL = oldUrl;
    if (oldSecret === undefined) delete process.env.ORDER_WEBHOOK_SECRET;
    else process.env.ORDER_WEBHOOK_SECRET = oldSecret;
  }
});
