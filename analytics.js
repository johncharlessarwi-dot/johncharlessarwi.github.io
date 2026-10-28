(function () {
  "use strict";

  // Queue events for Google Tag Manager (or another dataLayer-compatible tag).
  // No analytics vendor, measurement ID, cookie, or external request is added here.
  window.dataLayer = window.dataLayer || [];

  function track(eventName, link) {
    window.dataLayer.push({
      event: eventName,
      link_url: link ? link.href : undefined,
      page_path: window.location.pathname
    });
  }

  document.addEventListener("click", function (event) {
    const link = event.target.closest("a[href]");
    if (!link) return;

    const href = link.getAttribute("href") || "";
    if (/^(https?:\/\/)?(www\.)?wa\.me\//i.test(href) || /api\.whatsapp\.com/i.test(href)) {
      track("jos_whatsapp_click", link);
    } else if (/^mailto:/i.test(href)) {
      track("jos_email_click", link);
    } else if (/^tel:/i.test(href)) {
      track("jos_phone_click", link);
    }
  });

  document.addEventListener("submit", function (event) {
    if (event.target && event.target.id === "project-form") {
      track("jos_project_form_submit", null);
    }
  }, true);
})();
