(() => {
  const menu = document.getElementById("menu");
  const nav = document.getElementById("nav");
  if (!menu || !nav) return;
  const setOpen = open => {
    nav.classList.toggle("open", open);
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    menu.textContent = open ? "×" : "☰";
  };
  menu.addEventListener("click", () => setOpen(menu.getAttribute("aria-expanded") !== "true"));
  nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", event => { if (event.key === "Escape") setOpen(false); });
  document.addEventListener("click", event => {
    if (!nav.contains(event.target) && !menu.contains(event.target)) setOpen(false);
  });
  window.addEventListener("resize", () => { if (window.innerWidth > 680) setOpen(false); });
})();