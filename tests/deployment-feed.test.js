const test = require("node:test");
const assert = require("node:assert/strict");
const handler = require("../api/deployments");

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

async function callHandler(req) {
  const res = responseRecorder();
  await handler(req, res);
  return res;
}

test("delivery feed allows GET only", async () => {
  const res = await callHandler({ method: "POST" });
  assert.equal(res.statusCode, 405);
  assert.equal(res.headers.Allow, "GET");
});

test("returns public GitHub Actions workflow metadata without a Vercel token", async () => {
  const originalFetch = global.fetch;
  let requestedUrl;
  global.fetch = async url => {
    requestedUrl = url;
    return new Response(JSON.stringify({
      workflow_runs: [{
        name: "Portfolio tests",
        status: "completed",
        conclusion: "success",
        html_url: "https://github.com/johncharlessarwi-dot/johncharlessarwi.github.io/actions/runs/123",
        created_at: "2026-10-26T20:00:00Z",
        display_title: "test(site): validate delivery feed",
        head_branch: "main",
        head_sha: "abcdef1234567890"
      }]
    }), { status: 200, headers: { "content-type": "application/json" } });
  };
  try {
    const res = await callHandler({ method: "GET" });
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.source, "github-actions");
    assert.equal(res.body.count, 1);
    assert.equal(res.body.deployments[0].projectName, "Portfolio tests");
    assert.equal(res.body.deployments[0].state, "SUCCESS");
    assert.equal(res.body.deployments[0].commitRef, "main");
    assert.equal(res.body.deployments[0].commitSha, "abcdef1234567890");
    assert.match(requestedUrl, /api.github.com\/repos\/johncharlessarwi-dot\/johncharlessarwi\.github\.io\/actions\/runs/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("returns an empty optional feed when GitHub Actions is unavailable", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => new Response("rate limited", { status: 403 });
  try {
    const res = await callHandler({ method: "GET" });
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      deployments: [],
      source: "github-actions",
      count: 0,
      unavailable: true
    });
  } finally {
    global.fetch = originalFetch;
  }
});

test("returns a safe error when the public feed request fails", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => { throw new Error("private network diagnostic"); };
  try {
    const res = await callHandler({ method: "GET" });
    assert.equal(res.statusCode, 502);
    assert.doesNotMatch(JSON.stringify(res.body), /private network diagnostic/);
  } finally {
    global.fetch = originalFetch;
  }
});
