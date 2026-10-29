(function () {
  "use strict";

  // Vercel Web Analytics for this static HTML site.
  // Enable Web Analytics in the Vercel dashboard to activate the endpoint.
  // Queue events before the deferred script loads so the first page view is retained.
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

  // Preserve the existing interaction queue for a future tag-manager integration.
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
    var destination;
    try {
      destination = new URL(href, window.location.href);
    } catch (error) {
      return;
    }

    if (
      (destination.protocol === "https:" || destination.protocol === "http:") &&
      (destination.hostname === "wa.me" || destination.hostname === "www.wa.me" || destination.hostname === "api.whatsapp.com")
    ) {
      track("jos_whatsapp_click", link);
    } else if (href.toLowerCase().startsWith("mailto:")) {
      track("jos_email_click", link);
    } else if (href.toLowerCase().startsWith("tel:")) {
      track("jos_phone_click", link);
    }
  });

  document.addEventListener("submit", function (event) {
    if (event.target && event.target.id === "project-form") {
      track("jos_project_form_submit", null);
    }
  }, true);
})();
