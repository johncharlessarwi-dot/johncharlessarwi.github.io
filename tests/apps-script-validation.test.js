const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const code = fs.readFileSync(path.join(__dirname, '../google-apps-script/Code.gs'), 'utf8');
function invoke(payload) {
  const sent = [];
  const context = {
    console: { error() {} },
    PropertiesService: { getScriptProperties: () => ({ getProperty(key) {
      return key === 'ORDER_WEBHOOK_SECRET' ? 'secret-for-test' : '';
    } }) },
    GmailApp: { sendEmail(...args) { sent.push(args); } },
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
