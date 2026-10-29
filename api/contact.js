const { randomBytes } = require("node:crypto");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const body = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  const clean = (value, max) => String(value || "").trim().slice(0, max);
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });
  const name = clean(body.name, 100), email = clean(body.email, 160);
  const phone = clean(body.phone, 40), company = clean(body.company, 120);
  const service = clean(body.service, 100), budget = clean(body.budget, 100);
  const message = clean(body.message, 4000), timeline = clean(body.timeline, 100);
  const contactPreference = clean(body.contactPreference, 40);
  if (!name || !email || !service || message.length < 10 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email))
    return res.status(400).json({ error: "Please provide a valid name, email, service and project description." });

  const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const webhookSecret = process.env.ORDER_WEBHOOK_SECRET;
  if (!webhookUrl || !webhookSecret) {
    return res.status(503).json({ error: "Order email is not fully configured yet. Please email johncharlessarwi@gmail.com directly." });
  }

  const orderId = "JOS-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + randomBytes(4).toString("hex").slice(0,8).toUpperCase();
  const payload = { secret: webhookSecret, orderId, name, email, phone, company, service, budget, timeline, contactPreference, message, submittedAt: new Date().toISOString() };
  try {
    const response = await fetch(webhookUrl, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload), redirect: "follow"
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) return res.status(502).json({ error: "We could not deliver your order email. Please try again or contact us directly." });
    return res.status(200).json({ ok: true, orderId });
  } catch (error) {
    console.error("Order email delivery failed:", error.message);
    return res.status(502).json({ error: "Email delivery failed. Please try again later." });
  }
};
