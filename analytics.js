(function () {
  "use strict";

  // Vercel Web Analytics for this static HTML site.
  // The project must also have Web Analytics enabled in the Vercel dashboard.
  // The queue is created before the deferred script loads so early page views are retained.
  window.va = window.va || function () {
    (window.vaq = window.vaq || []).push(arguments);
  };

  if (!document.querySelector("script[data-vercel-analytics]")) {
    var analyticsScript = document.createElement("script");
    analyticsScript.defer = true;
    analyticsScript.src = "/_vercel/insights/script.js";
    analyticsScript.dataset.vercelAnalytics = "true";
    document.head.appendChild(analyticsScript);
  }

  // Keep the existing dataLayer events available for a future tag-manager integration.
  window.dataLayer = window.dataLayer || [];

  function track(eventName, link) {
    window.dataLayer.push({
      event: eventName,
      link_url: link ? link.href : undefined,
      page_path: window.location.pathname
    });
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    var link = target && typeof target.closest === "function"
      ? target.closest("a[href]")
      : null;
    if (!link) return;

    var href = link.getAttribute("href") || "";
    if (/^(https?:\\/\\/)?(www\\.)?wa\\.me\\//i.test(href) || /api\\.whatsapp\\.com/i.test(href)) {
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
