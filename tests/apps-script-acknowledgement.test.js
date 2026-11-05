const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../google-apps-script/Code.gs'), 'utf8');

test('team notification happens before customer acknowledgement', () => {
  const teamIndex = source.indexOf('GmailApp.sendEmail(inbox');
  const customerIndex = source.indexOf('GmailApp.sendEmail(data.email');
  assert.ok(teamIndex >= 0 && customerIndex > teamIndex);
});

test('customer acknowledgement errors cannot cancel accepted orders', () => {
  assert.match(source, /catch \(acknowledgementError\)/);
  assert.match(source, /Customer acknowledgement failed after order receipt/);
  assert.match(source, /return output\(\{ ok: true, orderId: data\.orderId \}\)/);
});

test("Apps Script independently validates email recipient syntax", () => {
  assert.match(source, /typeof data\.email !== "string"/);
  const emailCheck = source.split("\n").find(line => line.includes("typeof data.email"));
  assert.ok(emailCheck);
  assert.ok(emailCheck.includes(String.raw`[^\s@]`));
  assert.ok(!emailCheck.includes(String.raw`[^\\s@]`));
});
