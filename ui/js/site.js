(() => {
    "use strict";
    const page = document.body.dataset.page || "home";
    async function loadPartial(selector, path) {
        const target = document.querySelector(selector);
        if (!target) return;
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Could not load ${path}`);
        target.innerHTML = await response.text();
    }
    function setActiveLinks() {
        document.querySelectorAll(`[data-page="${page}"]`).forEach(link => {
            link.classList.add("is-current");
            link.setAttribute("aria-current", "page");
        });
    }
    function updateClock() {
        const clock = document.querySelector("[data-clock]");
        if (clock) clock.textContent = new Intl.DateTimeFormat([], { hour: "2-digit", minute: "2-digit" }).format(new Date());
    }
    async function init() {
        try {
            await Promise.all([loadPartial("[data-menu]", "/partials/menu.html"), loadPartial("[data-dock]", "/partials/dock.html")]);
            setActiveLinks(); updateClock(); window.setInterval(updateClock, 30000);
        } catch (error) { console.error(error); }
        document.documentElement.classList.add("site-ready");
    }
    init();
})();
