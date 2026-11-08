const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const code = fs.readFileSync(path.join(__dirname, '../google-apps-script/Code.gs'), 'utf8');
function invoke(payload, failConfirmation = false, state = {}) {
  const sent = [];
  const properties = state.properties || (state.properties = new Map());
  const context = {
    console: { error() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty(key) {
      return key === 'ORDER_WEBHOOK_SECRET' ? 'secret-for-test' : (properties.get(key) || '');
    }, setProperty(key, value) { properties.set(key, value); }, getProperties() { return Object.fromEntries(properties); }, deleteProperty(key) { properties.delete(key); } }) },
    LockService: { getScriptLock: () => ({ tryLock() { return state.lockAvailable !== false; }, releaseLock() { state.released = true; } }) },
    GmailApp: { sendEmail(...args) { if (failConfirmation && args[0] === payload.email) throw new Error("mailbox unavailable"); if (state.failTeam && args[0] !== payload.email) throw new Error("team mailbox unavailable"); sent.push(args); } },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput(value) {
      return { value, setMimeType() { return this; } };
    } }
  };
  vm.runInNewContext(code, context);
  const result = context.doPost({ postData: { contents: JSON.stringify(payload) } });
  return { result: JSON.parse(result.value), sent };
}
const base = { secret:'secret-for-test', orderId:'JOS-20261105-ABCDEF12', name:'Test Customer', email:'test@example.com', service:'Website', message:'A valid project request.' };

test('rejects forged order reference before sending email', () => {
  const { result, sent } = invoke({ ...base, orderId:'other\nBcc:attack@example.com' });
  assert.equal(result.ok, false);
  assert.equal(sent.length, 0);
});

test('accepts legitimate order reference', () => {
  const { result, sent } = invoke(base);
  assert.equal(result.ok, true);
  assert.equal(result.orderId, base.orderId);
  assert.equal(sent.length, 2);
});

test("customer confirmation failure does not invalidate accepted order", () => {
  const { result, sent } = invoke(base, true);
  assert.equal(result.ok, true);
  assert.equal(sent.length, 1);
});

test("Apps Script rejects malformed customer email before delivery", () => {
  const { result, sent } = invoke({ ...base, email: "customer\n@example.com" });
  assert.equal(result.ok, false);
  assert.equal(sent.length, 0);
});

test("Apps Script refuses unsigned or mismatched webhook secrets", () => {
  for (const secret of ["", "incorrect-secret"]) {
    const { result, sent } = invoke({ ...base, secret });
    assert.equal(result.ok, false);
    assert.equal(sent.length, 0);
  }
});


test("Apps Script refuses oversized webhook payloads without delivering emails", () => {
  const { result, sent } = invoke({ ...base, message: "x".repeat(21000) });
  assert.equal(result.ok, false);
  assert.equal(sent.length, 0);
});


test("Apps Script rejects subject and name header injection independently", () => {
  for (const field of ["service", "name"]) {
    const { result, sent } = invoke({ ...base, [field]: "Website" + String.fromCharCode(13, 10) + "Bcc:intruder@example.com" });
    assert.equal(result.ok, false, field);
    assert.equal(sent.length, 0, field);
  }
});


test("Apps Script enforces independent customer field size limits", () => {
  for (const patch of [{ email: "a".repeat(160) + "@example.com" }, { message: "x".repeat(4001) }]) {
    const { result, sent } = invoke({ ...base, ...patch });
    assert.equal(result.ok, false);
    assert.equal(sent.length, 0);
  }
});


test("Apps Script blocks directional control characters in order details", () => {
  const { result, sent } = invoke({ ...base, message: "Website" + String.fromCharCode(0x202E) + "details" });
  assert.equal(result.ok, false);
  assert.equal(sent.length, 0);
});


test("Apps Script rejects malformed optional order fields", () => {
  for (const patch of [{ phone: { unexpected: true } }, { company: "x".repeat(121) }, { contactPreference: "x".repeat(41) }]) {
    const { result, sent } = invoke({ ...base, ...patch });
    assert.equal(result.ok, false);
    assert.equal(sent.length, 0);
  }
});


test("Apps Script acknowledges retried order IDs without duplicate email delivery", () => {
  const state = {};
  const first = invoke(base, false, state);
  const second = invoke(base, false, state);
  assert.equal(first.result.ok, true);
  assert.equal(first.sent.length, 2);
  assert.equal(second.result.ok, true);
  assert.equal(second.result.orderId, base.orderId);
  assert.equal(second.sent.length, 0);
  assert.equal(state.released, true);
});


test("Apps Script refuses delivery when order lock is unavailable", () => {
  const { result, sent } = invoke(base, false, { lockAvailable: false });
  assert.equal(result.ok, false);
  assert.equal(sent.length, 0);
});


test("failed team delivery does not mark the order as processed", () => {
  const state = { failTeam: true };
  const first = invoke(base, false, state);
  assert.equal(first.result.ok, false);
  assert.equal(first.sent.length, 0);
  assert.equal(state.properties.has("ORDER_DONE_" + base.orderId), false);
  assert.equal(state.released, true);
  state.failTeam = false;
  const retry = invoke(base, false, state);
  assert.equal(retry.result.ok, true);
  assert.equal(retry.sent.length, 2);
});
