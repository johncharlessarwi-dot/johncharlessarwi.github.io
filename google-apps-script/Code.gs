function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var props = PropertiesService.getScriptProperties();
    var expected = props.getProperty("ORDER_WEBHOOK_SECRET") || "";
    if (!expected || data.secret !== expected) return output({ ok: false, error: "Unauthorized" });
    ["orderId", "name", "email", "service", "message"].forEach(function (key) {
      if (!String(data[key] || "").trim()) throw new Error("Missing required field: " + key);
    });
    var inbox = props.getProperty("ORDER_INBOX") || "johncharlessarwi@gmail.com";
    var escapeHtml = function (value) {
      return String(value || "").replace(/[&<>"']/g, function (ch) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
      });
    };
    var fields = [
      ["Order reference", data.orderId], ["Customer", data.name], ["Email", data.email],
      ["Phone / WhatsApp", data.phone || "Not provided"], ["Company", data.company || "Not provided"],
      ["Service", data.service], ["Budget", data.budget || "Not specified"],
      ["Timeline", data.timeline || "Not specified"],
      ["Preferred contact", data.contactPreference || "Email or phone"],
      ["Submitted", data.submittedAt || new Date().toISOString()]
    ];
    var plain = "NEW PROJECT ORDER — " + data.orderId + "\n\n" +
      fields.map(function (field) { return field[0] + ": " + field[1]; }).join("\n") +
      "\n\nPROJECT DETAILS\n" + data.message;
    var html = "<h2>New project order received</h2><h3>Reference: " + escapeHtml(data.orderId) +
      "</h3><table cellpadding='8' cellspacing='0' style='border-collapse:collapse'>" +
      fields.map(function (field) { return "<tr><td><b>" + escapeHtml(field[0]) +
      "</b></td><td>" + escapeHtml(field[1]) + "</td></tr>"; }).join("") +
      "</table><h3>Project details</h3><p style='white-space:pre-wrap'>" + escapeHtml(data.message) + "</p>";
    GmailApp.sendEmail(inbox, "New project order " + data.orderId + " — " + data.service,
      plain, { htmlBody: html, replyTo: data.email, name: "JOHN ONLINE SERVICES AND APPLICATIONS" });
    var confirmation = "Hello " + data.name + ",\n\nWe have received your project request.\n" +
      "Your order reference is " + data.orderId + ".\nRequested service: " + data.service +
      "\n\nWe will review your details and contact you soon.\n\nJOHN ONLINE SERVICES AND APPLICATIONS\njohncharlessarwi@gmail.com";
    GmailApp.sendEmail(data.email, "We received your project request — " + data.orderId,
      confirmation, { name: "JOHN ONLINE SERVICES AND APPLICATIONS" });
    return output({ ok: true, orderId: data.orderId });
  } catch (error) {
    console.error(error);
    return output({ ok: false, error: "Order processing failed" });
  }
}
function output(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}