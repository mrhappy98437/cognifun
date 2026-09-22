/*
 * NJSP launcher UI
 *
 * This file owns the browser-facing layer only. The Python launcher remains
 * responsible for the registry, alias checks, reports, and process launches.
 */

(() => {
    "use strict";

    const STAGE_WIDTH = 1600;
    const STAGE_HEIGHT = 1000;
    const MOBILE_BREAKPOINT = 900;
    const DOCK_CATEGORY_IDS = new Set(["about", "books", "order", "learning", "courses", "contact"]);

    const DOCK_ICON_BY_CATEGORY = {
        about: "about",
        books: "portfolio",
        order: "download-icon",
        learning: "book-icon",
        courses: "services",
        contact: "contact",
    };

    const state = {
        menu: null,
        categoryId: "home",
        toastTimer: null,
    };

    const PUBLISHING_MENU = {
        title: "Cognifun Publishing",
        subtitle: "Books, learning, and ideas",
        tabs: [
            { id: "home", label: "Home", description: "Where learning gets fun.", entries: [], sections: [] },
            { id: "about", label: "About Us", description: "Books and learning tools for curious readers.", content: "We’re Cognifun Publishing — on a mission to prove that learning and fun aren’t opposites. We create playful, brain-friendly books and learning tools for classrooms, families, and every child who deserves a book that sparks excitement.", entries: [], sections: [] },
            {
                id: "books",
                label: "Book Gallery",
                description: "Inspiring stories and educational workbooks.",
                content: "Browse the Cognifun catalogue — inspirational story collections and educational workbooks. Start with Stories for Brave Girls, or explore our educational and test-preparation titles.",
                books: [
                    { title: "Stories for Brave Girls", meta: "Collection · Ages 6–12", image: "brave-girls-collection.jpg", description: "A heartwarming collection of short stories that inspire courage, self-belief, and never giving up." },
                    { title: "Everyday Stories of Courage", meta: "Amazing Girls Series · Amelia J Apple", image: "everyday-courage.jpg", description: "A powerful and uplifting collection that helps girls discover the bravery already inside them." },
                    { title: "Heartwarming Stories for Young Girls", meta: "Amazing Girls Series · Amelia J Apple", image: "heartwarming-stories.jpg", description: "A warm collection filled with kindness, courage, and confidence-building moments." },
                    { title: "Empowering Stories for Girls", meta: "Amazing Girls Series · Amelia J Apple", image: "empowering-stories.jpg", description: "A deeply encouraging collection showing girls how confidence grows through patience and perseverance." },
                    { title: "Texas STAAR Math", meta: "Educational workbook · Texas", image: "texas-staar-math.png", description: "A Cognifun educational title for learners preparing for Texas STAAR mathematics." },
                ],
                entries: [],
                sections: [],
            },
            { id: "order", label: "Order Books", description: "Find the right Cognifun book for your reader.", content: "Choose from individual titles or the Stories for Brave Girls collection. Ordering details and purchase links will be added here as each edition becomes available.", entries: [], sections: [] },
            { id: "learning", label: "Learning Resources", description: "Learning resources for curious readers.", content: "Our books are designed to make learning feel inviting, useful, and memorable — from confidence-building stories to educational workbooks and test-preparation resources.", entries: [], sections: [] },
            { id: "courses", label: "Courses", description: "Free learning experiences are coming soon.", content: "We love learning, and we believe it should feel exciting, welcoming, and fun. Cognifun courses are being planned as free learning experiences exploring history, science, and the world around us. We want to turn big ideas into clear, engaging lessons that invite curiosity and make learning fun. Check back soon.", entries: [], sections: [] },
            { id: "contact", label: "Contact", description: "Contact Cognifun Publishing.", content: "Questions about our books, schools, or publishing partnerships can be directed here.", entries: [], sections: [] },
        ],
        summary: { ready: 0, unavailable: 0 },
    };

    const byId = id => document.getElementById(id);

    function make(tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (text !== undefined) element.textContent = text;
        return element;
    }

    async function request(url, options) {
        const response = await fetch(url, options);
        let data;
        try {
            data = await response.json();
        } catch {
            data = { error: `Request failed (${response.status})` };
        }
        if (!response.ok) {
            const error = new Error(data.error || `Request failed (${response.status})`);
            error.data = data;
            throw error;
        }
        return data;
    }

    function categoryTabs() {
        return (state.menu?.tabs || []).filter(tab => tab.id !== "home");
    }

    function currentTab() {
        return (state.menu?.tabs || []).find(tab => tab.id === state.categoryId)
            || state.menu?.tabs?.[0]
            || { id: "home", label: "Home", description: "", entries: [], sections: [] };
    }

    function categoryFromUrl() {
        const requested = new URL(window.location.href).searchParams.get("category");
        const valid = new Set((state.menu?.tabs || []).map(tab => tab.id));
        if (requested && valid.has(requested)) return requested;
        return categoryTabs()[0]?.id || "home";
    }

    function setCategory(categoryId, { replace = false } = {}) {
        const valid = new Set((state.menu?.tabs || []).map(tab => tab.id));
        const nextId = valid.has(categoryId) ? categoryId : "home";
        state.categoryId = nextId;

        const url = new URL(window.location.href);
        if (nextId === "home") {
            url.searchParams.delete("category");
        } else {
            url.searchParams.set("category", nextId);
        }

        const method = replace ? "replaceState" : "pushState";
        window.history[method]({}, "", url);
        render();
    }

    function setMobileMode() {
        const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
        document.body.classList.toggle("njsp-layout-mobile", isMobile);
        return isMobile;
    }

    function cssPixelValue(variableName, fallback) {
        const value = Number.parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue(variableName),
        );
        return Number.isFinite(value) ? value : fallback;
    }

    function updateClock() {
        const clock = byId("clock");
        if (!clock) return;
        const now = new Date();
        clock.textContent = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    }

    function scaleStage() {
        const stage = document.querySelector(".njsp-stage");
        const shell = document.querySelector(".njsp-stage-shell");
        if (!stage || !shell) return;

        if (setMobileMode()) {
            stage.style.transform = "none";
            shell.style.height = "auto";
            return;
        }

        const topGap = cssPixelValue("--njsp-stage-top-gap", 0);
        const bottomGap = cssPixelValue("--njsp-stage-bottom-gap", 0);
        const availableHeight = Math.max(window.innerHeight - topGap - bottomGap, 320);
        const scale = Math.min(shell.clientWidth / STAGE_WIDTH, availableHeight / STAGE_HEIGHT, 1);
        const scaledWidth = STAGE_WIDTH * scale;
        const scaledHeight = STAGE_HEIGHT * scale;
        stage.style.transform = `scale(${scale})`;
        stage.style.left = `${Math.max((shell.clientWidth - scaledWidth) / 2, 0)}px`;
        stage.style.top = "0px";
        shell.style.height = `${scaledHeight}px`;
    }

    function renderNavigationState() {
        document.querySelectorAll("[data-category]").forEach(element => {
            const active = element.dataset.category === state.categoryId;
            element.classList.toggle("is-current", active);
            if (active) {
                element.setAttribute("aria-current", "page");
            } else {
                element.removeAttribute("aria-current");
            }
        });
    }

    function renderDock() {
        const dock = byId("dockIcons");
        if (!dock) return;

        dock.replaceChildren();
        categoryTabs().filter(tab => DOCK_CATEGORY_IDS.has(tab.id)).forEach(tab => {
            const iconName = DOCK_ICON_BY_CATEGORY[tab.id] || "portfolio";
            const item = make("button", "njsp-dock-icon");
            item.type = "button";
            item.dataset.category = tab.id;
            item.setAttribute("aria-label", `Open ${tab.label}`);

            const image = document.createElement("img");
            image.src = `images/dock/${iconName}.png`;
            image.alt = "";
            image.width = 85;
            image.height = 85;

            item.append(
                image,
                make("span", "njsp-dock-icon-label", tab.label),
            );
            dock.appendChild(item);
        });
    }

    function renderCategoryMenu() {
        const menu = byId("categoryMenuItems");
        if (!menu) return;

        menu.replaceChildren();
        ["books", "learning", "courses"].forEach(categoryId => {
            const tab = (state.menu?.tabs || []).find(item => item.id === categoryId);
            if (!tab) return;
            const item = make("button", "njsp-dropdown-item", tab.label);
            item.type = "button";
            item.dataset.category = tab.id;
            menu.appendChild(item);
        });
    }

    function renderHome(content) {
        const heading = make("div", "njsp-home-introduction");
        heading.appendChild(make("p", "njsp-page-description", "We build playful, brain-friendly books and learning tools. Short stories, big ideas, and a little fun along the way."));
        content.appendChild(heading);

        const grid = make("div", "njsp-category-grid");
        categoryTabs().forEach(tab => {
            const windowCard = make("article", "njsp-app-window");
            const inner = make("div", "njsp-app-window-content");
            const footer = make("div", "njsp-app-footer");
            const button = make("button", "njsp-open-button", "Open");
            button.type = "button";
            button.dataset.category = tab.id;

            inner.append(
                make("h3", "njsp-app-name", tab.label),
                make("p", "njsp-app-description", tab.description || "Open this application category."),
            );
            footer.append(
                make("span", "njsp-app-status", "Category"),
                button,
            );
            inner.appendChild(footer);
            windowCard.appendChild(inner);
            grid.appendChild(windowCard);
        });
        content.appendChild(grid);
    }

    function addSection(parent, title, entries) {
        if (!entries.length) return;

        const section = make("section", "njsp-app-section");
        if (title) section.appendChild(make("h3", "njsp-section-title", title));

        const grid = make("div", "njsp-category-grid");
        entries.forEach(entry => grid.appendChild(appWindow(entry)));
        section.appendChild(grid);
        parent.appendChild(section);
    }

    function appWindow(entry) {
        const card = make("article", `njsp-app-window${entry.available ? "" : " unavailable"}`);
        const content = make("div", "njsp-app-window-content");
        const footer = make("div", "njsp-app-footer");
        const status = make("span", "njsp-app-status", entry.available ? "Ready" : entry.reason);
        status.title = entry.reason || "";

        const button = make("button", "njsp-open-button", entry.available ? "Open" : "Unavailable");
        button.type = "button";
        button.disabled = !entry.available;
        button.addEventListener("click", () => launch(entry, button));

        content.appendChild(make("h3", "njsp-app-name", entry.label));
        content.appendChild(make("div", "njsp-app-target", entry.alias || entry.target || entry.action || ""));

        const metadata = make("div", "njsp-app-meta");
        metadata.append(
            metadataRow("venv", entry.venv || "Not mapped"),
            metadataRow("alias", entry.alias || "Not mapped"),
            metadataRow("location", compactLocation(entry.location), entry.location),
        );
        content.appendChild(metadata);
        footer.append(status, button);
        content.appendChild(footer);
        card.appendChild(content);
        return card;
    }

    function metadataRow(label, value, title = "") {
        const row = make("div", "njsp-app-meta-row");
        const valueElement = make("span", "njsp-app-meta-value", value);
        if (title) valueElement.title = title;
        row.append(
            make("span", "njsp-app-meta-label", `${label}:`),
            valueElement,
        );
        return row;
    }

    function compactLocation(location) {
        if (!location) return "Not mapped";
        const parts = location.split("/").filter(Boolean);
        return parts.length > 3 ? `…/${parts.slice(-2).join("/")}` : location;
    }

    function renderCategory(content, tab) {
        if (tab.content) {
            const windowCard = make("article", "njsp-app-window");
            const inner = make("div", "njsp-app-window-content");
            inner.append(
                make("h3", "njsp-app-name", tab.label),
                make("p", "njsp-app-description", tab.content),
            );
            windowCard.appendChild(inner);
            content.appendChild(windowCard);
        }
        if (tab.books?.length) {
            const bookGrid = make("div", "njsp-book-grid");
            tab.books.forEach(book => {
                const card = make("article", "njsp-book-card");
                const image = document.createElement("img");
                image.src = `images/books/${book.image}`;
                image.alt = book.title;
                card.append(
                    image,
                    make("h3", "njsp-book-title", book.title),
                    make("p", "njsp-book-meta", book.meta || "Cognifun Publishing"),
                    make("p", "njsp-book-description", book.description),
                );
                bookGrid.appendChild(card);
            });
            content.appendChild(bookGrid);
        }
        addSection(content, "", tab.entries || []);
        (tab.sections || []).forEach(section => addSection(content, section.title, section.entries || []));

        const hasEntries = tab.content || (tab.entries || []).length
            || (tab.sections || []).some(section => (section.entries || []).length);
        if (!hasEntries) {
            content.appendChild(make("div", "njsp-empty", "This category does not contain any launcher entries yet."));
        }
    }

    function render() {
        if (!state.menu) return;

        const tab = currentTab();
        const title = byId("appTitle");
        const subtitle = byId("appSubtitle");
        const pageTitle = byId("pageTitle");
        const pageDescription = byId("pageDescription");
        const summary = byId("summary");
        const content = byId("content");

        document.title = `${tab.label} · ${state.menu.title}`;
        if (title) title.textContent = state.menu.title;
        if (subtitle) subtitle.textContent = tab.id === "home" ? state.menu.subtitle : tab.label;
        if (pageTitle) pageTitle.textContent = tab.label;
        if (pageDescription) pageDescription.textContent = tab.description || "";
        if (summary) {
            const { ready = 0, unavailable = 0 } = state.menu.summary || {};
            summary.textContent = ready || unavailable ? `${ready} ready · ${unavailable} need setup` : "";
        }

        document.body.classList.toggle("njsp-view-home", tab.id === "home");
        document.body.classList.toggle("njsp-view-category", tab.id !== "home");

        renderDock();
        renderCategoryMenu();
        renderNavigationState();

        if (!content) return;
        content.replaceChildren();
        if (tab.id === "home") {
            renderHome(content);
        } else {
            renderCategory(content, tab);
        }
        scaleStage();
    }

    function showToast(message, isError = false, duration = 4000) {
        document.querySelector(".njsp-toast")?.remove();
        const toast = make("div", `njsp-toast${isError ? " is-error" : ""}`, message);
        toast.setAttribute("role", "status");
        document.body.appendChild(toast);
        window.clearTimeout(state.toastTimer);
        state.toastTimer = window.setTimeout(() => toast.remove(), duration);
    }

    function showLaunchError(label, error) {
        const dialog = byId("errorDialog");
        const details = error.data?.details || error.message;
        const reportPath = error.data?.report_path || "No report file could be written.";
        if (!dialog) {
            showToast(`${label}: ${details}`, true, 12000);
            return;
        }

        const title = byId("errorTitle");
        const report = byId("errorReport");
        const output = byId("errorOutput");
        if (title) title.textContent = `${label} failed to open`;
        if (report) report.textContent = `Report: ${reportPath}`;
        if (output) output.textContent = details;
        if (typeof dialog.showModal === "function") {
            dialog.showModal();
        } else {
            showToast(`${label}: ${details}`, true, 12000);
        }
    }

    async function launch(entry, button) {
        const oldText = button.textContent;
        button.disabled = true;
        button.textContent = "Opening…";

        try {
            const result = await request("/api/launch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entry_id: entry.entry_id }),
            });
            const verb = result.status === "running" ? "Started" : "Finished";
            showToast(`${verb} ${entry.label} · report saved`);
        } catch (error) {
            showToast(`${entry.label}: ${error.message}`, true, 12000);
            showLaunchError(entry.label, error);
        } finally {
            button.disabled = false;
            button.textContent = oldText;
        }
    }

    async function openReports() {
        try {
            const result = await request("/api/open-reports", { method: "POST" });
            showToast(`Opened ${result.path}`);
        } catch (error) {
            showToast(`Could not open reports: ${error.message}`, true, 12000);
        }
    }

    async function runDiagnostics() {
        const button = byId("diagnosticsButton");
        const oldText = button?.textContent || "Run Diagnostics";
        if (button) {
            button.disabled = true;
            button.textContent = "Checking…";
        }

        try {
            const result = await request("/api/diagnostics", { method: "POST" });
            const summary = result.summary;
            const message = `Diagnostics complete · ${summary.PASS} pass · ${summary.FAIL} fail · ${summary.NA} N/A`;
            showToast(result.open_warning ? `${message} · report saved but could not open` : message, Boolean(result.open_warning), 12000);
        } catch (error) {
            showToast(`Diagnostics failed: ${error.message}`, true, 12000);
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = oldText;
            }
        }
    }

    function bindEvents() {
        document.addEventListener("click", event => {
            const categoryTarget = event.target.closest("[data-category]");
            if (categoryTarget) {
                event.preventDefault();
                setCategory(categoryTarget.dataset.category);
                return;
            }

            const menuTrigger = event.target.closest(".njsp-nav-menu-trigger");
            if (menuTrigger) {
                const menu = menuTrigger.closest(".njsp-nav-menu");
                if (!menu) return;
                const wasOpen = menu.classList.contains("is-open");
                document.querySelectorAll(".njsp-nav-menu.is-open").forEach(item => item.classList.remove("is-open"));
                if (!wasOpen) menu.classList.add("is-open");
                event.stopPropagation();
                return;
            }

            document.querySelectorAll(".njsp-nav-menu.is-open").forEach(item => item.classList.remove("is-open"));
        });

        byId("diagnosticsButton")?.addEventListener("click", runDiagnostics);
        byId("reportsButton")?.addEventListener("click", openReports);
        byId("errorReportsButton")?.addEventListener("click", openReports);
        byId("closeErrorButton")?.addEventListener("click", () => byId("errorDialog")?.close());

        window.addEventListener("popstate", () => {
            state.categoryId = categoryFromUrl();
            render();
        });
        window.addEventListener("resize", scaleStage);
    }

    async function loadMenu() {
        state.menu = PUBLISHING_MENU;
        state.categoryId = categoryFromUrl();
        render();
    }

    function init() {
        bindEvents();
        updateClock();
        window.setInterval(updateClock, 30000);
        scaleStage();
        loadMenu();
    }

    window.NJSPLauncher = {
        loadMenu,
        setCategory,
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
