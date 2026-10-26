module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const body = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  const clean = (value, max) => String(value || "").trim().slice(0, max);
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });
  const name = clean(body.name, 100);
  const email = clean(body.email, 160);
  const phone = clean(body.phone, 40);
  const company = clean(body.company, 120);
  const service = clean(body.service, 100);
  const budget = clean(body.budget, 100);
  const message = clean(body.message, 4000);
  if (!name || !email || !service || message.length < 10 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "Please provide a valid name, email, service and project description." });
  }
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return res.status(503).json({ error: "Email delivery is not configured yet. Please email johncharlessarwi@gmail.com directly for now." });
  }
  const escape = value => value.replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
  const to = process.env.CONTACT_TO || "johncharlessarwi@gmail.com";
  const text = [
    "New portfolio project enquiry",
    "Name: " + name,
    "Email: " + email,
    "Phone: " + (phone || "Not provided"),
    "Company: " + (company || "Not provided"),
    "Service: " + service,
    "Budget: " + (budget || "Not specified"),
    "",
    "Project details:",
    message
  ].join("\n");
  const html = "<h2>New portfolio project enquiry</h2><p><b>Name:</b> " + escape(name) +
    "</p><p><b>Email:</b> " + escape(email) + "</p><p><b>Phone:</b> " + escape(phone || "Not provided") +
    "</p><p><b>Company:</b> " + escape(company || "Not provided") + "</p><p><b>Service:</b> " + escape(service) +
    "</p><p><b>Budget:</b> " + escape(budget || "Not specified") + "</p><h3>Project details</h3><p>" +
    escape(message).replace(/\n/g, "<br>") + "</p>";
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL,
        to: [to],
        reply_to: email,
        subject: "New project enquiry — " + name,
        text,
        html
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("Resend rejected portfolio enquiry:", response.status, result.name || result.message || "provider error");
      return res.status(502).json({ error: "The email provider could not deliver this message. Please try again or email directly." });
    }
    return res.status(200).json({ ok: true, id: result.id });
  } catch (error) {
    console.error("Portfolio contact delivery failed:", error.message);
    return res.status(502).json({ error: "Email delivery failed. Please try again later." });
  }
};
