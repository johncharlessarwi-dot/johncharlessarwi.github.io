const { randomBytes } = require("node:crypto");

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const contentType = req.headers && (req.headers["content-type"] || req.headers["Content-Type"]);
  if (contentType && !/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    return res.status(415).json({ error: "Send the enquiry as JSON." });
  }
  const body = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({ error: "Invalid enquiry data." });
  }
  if (Object.keys(body).length === 0) {
    return res.status(400).json({ error: "Enquiry cannot be empty." });
  }
  const clean = (value, max) => typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max) : "";
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });
  const cleanMessage = (value, max) => typeof value === "string" ? value.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ").trim().slice(0, max) : "";
  if (typeof body.message === "string" && body.message.length > 4000) {
    return res.status(413).json({ error: "Project description is too long." });
  }
  if (typeof body.name === "string" && body.name.length > 100) {
    return res.status(413).json({ error: "Name is too long." });
  }
  if (typeof body.email === "string" && body.email.length > 160) {
    return res.status(413).json({ error: "Email address is too long." });
  }
  if (typeof body.email === "string" && /[\r\n]/.test(body.email)) {
    return res.status(400).json({ error: "Invalid email address." });
  }
  if (typeof body.name === "string" && /[\r\n]/.test(body.name)) {
    return res.status(400).json({ error: "Invalid customer name." });
  }
  if (typeof body.service === "string" && body.service.length > 100) {
    return res.status(413).json({ error: "Service description is too long." });
  }
  if (body.message !== undefined && typeof body.message !== "string") {
    return res.status(400).json({ error: "Project description must be text." });
  }
  const name = clean(body.name, 100), email = clean(body.email, 160);
  const phone = clean(body.phone, 40), company = clean(body.company, 120);
  const service = clean(body.service, 100), budget = clean(body.budget, 100);
  const message = cleanMessage(body.message, 4000), timeline = clean(body.timeline, 100);
  const contactPreference = clean(body.contactPreference, 40);
  if (!name || !email || !service || message.length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Please provide a valid name, email, service and project description." });

  const webhookUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  const webhookSecret = process.env.ORDER_WEBHOOK_SECRET;
  if (!webhookUrl || !webhookSecret) {
    return res.status(503).json({ error: "Order email is not fully configured yet. Please email johncharlessarwi@gmail.com directly." });
  }

  // Never send the shared webhook secret to a non-Google endpoint.
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec\/?$/.test(webhookUrl)) {
    return res.status(503).json({ error: "Order delivery endpoint is misconfigured." });
  }

  const orderId = "JOS-" + new Date().toISOString().slice(0,10).replace(/-/g,"") + "-" + randomBytes(4).toString("hex").slice(0,8).toUpperCase();
  const payload = { secret: webhookSecret, orderId, name, email, phone, company, service, budget, timeline, contactPreference, message, submittedAt: new Date().toISOString() };
  try {
    const response = await fetch(webhookUrl, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload), redirect: "follow", signal: AbortSignal.timeout(8000)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true || result.orderId !== orderId) return res.status(502).json({ error: "We could not deliver your order email. Please try again or contact us directly." });
    return res.status(200).json({ ok: true, orderId });
  } catch (error) {
    console.error("Order email delivery failed.");
    return res.status(502).json({ error: "Email delivery failed. Please try again later." });
  }
};
