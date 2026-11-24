const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const chrome = process.env.CHROME_BIN || ["google-chrome", "chromium"].find(
  command => spawnSync(command, ["--version"]).status === 0
);

for (const [width, height] of [[320, 568], [568, 320], [768, 1024], [1440, 900]]) {
  test(`contact page is reachable from navigation at ${width}x${height}`, { skip: !chrome && !process.env.CI }, () => {
    assert.ok(chrome, "Install Chrome or provide CHROME_BIN");
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "nav-layout-"));
    try {
      const html = fs.readFileSync(path.join(root, "about.html"), "utf8");
      const probe = `<script>
        addEventListener("load", () => {
          const toggle = document.querySelector("#menu");
          if (getComputedStyle(toggle).display !== "none") toggle.click();
          const contact = document.querySelector('#nav a[href$="contact.html"]');
          contact.scrollIntoView({block: "center", behavior: "instant"});
          const box = contact.getBoundingClientRect();
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          if (innerWidth === ${width} && innerHeight === ${height} && box.width && box.height && contact.contains(document.elementFromPoint(x, y))) {
            parent.postMessage("contact-reachable", "*");
          }
        });
      </script>`;
      const base = pathToFileURL(root + path.sep).href;
      const fixture = path.join(temp, "page.html");
      fs.writeFileSync(fixture, html.replace(/<head>/i, '<head><base href="' + base + '">').replace("</body>", probe + "</body>"));
      const frame = path.join(temp, "viewport.html");
      fs.writeFileSync(frame, `<!doctype html><style>*{margin:0;border:0}</style>
        <script>onmessage = event => { if (event.source === frames[0] && event.data === "contact-reachable") document.body.dataset.contactReachable = "yes"; };</script>
        <iframe src="page.html" width="${width}" height="${height}"></iframe>`);
      const result = spawnSync(chrome, [
        "--headless", "--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage",
        "--disable-background-networking", "--host-resolver-rules=MAP * ~NOTFOUND",
        "--allow-file-access-from-files", "--hide-scrollbars", "--force-device-scale-factor=1",
        "--user-data-dir=" + path.join(temp, "profile"), "--window-size=1600,1200",
        "--virtual-time-budget=3000", "--dump-dom", pathToFileURL(frame).href,
      ], { encoding: "utf8", timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
      assert.equal(result.status, 0, result.error?.message || result.stderr);
      assert.match(result.stdout, /<body[^>]*data-contact-reachable="yes"/);
      assert.ok(fs.existsSync(path.join(root, "contact.html")));
    } finally {
      fs.rmSync(temp, { recursive: true, force: true });
    }
  });
}
