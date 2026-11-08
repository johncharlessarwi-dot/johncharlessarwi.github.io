const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const code = fs.readFileSync(path.join(__dirname, '../google-apps-script/Code.gs'), 'utf8');
function invoke(payload, failConfirmation = false) {
  const sent = [];
  const context = {
    console: { error() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty(key) {
      return key === 'ORDER_WEBHOOK_SECRET' ? 'secret-for-test' : '';
    } }) },
    GmailApp: { sendEmail(...args) { if (failConfirmation && args[0] === payload.email) throw new Error("mailbox unavailable"); sent.push(args); } },
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
