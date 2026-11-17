(function () {
    let headerObserver = null;
    window.__TB_REORDERING__ = false;
    const MAX_ATTEMPTS = 40;
    window.__BLUEWAVE_TOPNAV_ENABLED__ = true;
    let themes = {}; // global or module-level
    window.__themesCache = window.__themesCache || null;
    window.__themesCachePromise = null;

    const SUBACCOUNT_ORDER_MAP = {
        "sb_launchpad": "launchpad",
        "sb_dashboard": "dashboard",
        "sb_conversations": "conversations",
        "sb_opportunities": "opportunities",
        "sb_calendars": "calendars",
        "sb_contacts": "contacts",
        "sb_payments": "payments",
        "sb_vibe": "vibe",
        "sb_reporting": "reporting",
        "sb_email-marketing": "marketing",
        "sb_automation": "automation",
        "sb_sites": "sites",
        "sb_app-media": "media-storage",
        "sb_memberships": "memberships",
        "sb_reputation": "reputation",
        "sb_app-marketplace": "app-marketplace",
        "sb_location-mobile-app": "mobile-app"
    };

    function applySubaccountMenuOrderCSS(order) {
        if (window.__TB_REORDERING__) return;
        window.__TB_REORDERING__ = true;

        const old = document.getElementById("tb-menu-order-css");
        if (old) old.remove();

        let css = "";
        order.forEach((menuId, index) => {
            css += `#${menuId} { order: ${index} !important; }\n`;
        });

        const allMenus = document.querySelectorAll('#sidebar-v2 [id^="sb_"]');
        let endIndex = order.length;
        allMenus.forEach(el => {
            if (!order.includes(el.id)) {
                css += `#${el.id} { order: ${endIndex++} !important; }\n`;
            }
        });

        order.forEach((menuId, index) => {
            const cssKey = SUBACCOUNT_ORDER_MAP[menuId];
            if (cssKey) document.documentElement.style.setProperty(`--${cssKey}-order`, index);
        });

        const style = document.createElement("style");
        style.id = "tb-menu-order-css";
        style.textContent = css;
        document.head.appendChild(style);

        requestAnimationFrame(() => { window.__TB_REORDERING__ = false; });
    }
    window.applySubaccountMenuOrderCSS = applySubaccountMenuOrderCSS;

    function updateAgencyaccountSidebarRuntime(newOrder) {
        if (window.__TB_REORDERING__) return;
        window.__TB_REORDERING__ = true;

        const old = document.getElementById("tb-agency-menu-order-css");
        if (old) old.remove();

        const metaOrder = newOrder.map(id => id.replace(/^sb_/, ""));
        let css = "";
        metaOrder.forEach((metaKey, index) => {
            css += `a[meta="${metaKey}"] { order: ${index} !important; }\n`;
        });

        const tryInject = setInterval(() => {
            const sidebarNav = document.querySelector('.hl_nav-header nav[aria-label="header"]');
            if (!sidebarNav) return;
            clearInterval(tryInject);

            let endIndex = metaOrder.length;
            sidebarNav.querySelectorAll("[meta]").forEach(el => {
                const metaKey = el.getAttribute("meta");
                if (!metaOrder.includes(metaKey)) {
                    css += `a[meta="${metaKey}"] { order: ${endIndex++} !important; }\n`;
                }
            });

            const style = document.createElement("style");
            style.id = "tb-agency-menu-order-css";
            style.textContent = css;
            document.head.appendChild(style);

            requestAnimationFrame(() => { window.__TB_REORDERING__ = false; });
        }, 50);
        setTimeout(() => clearInterval(tryInject), 10000);
    }
    window.updateAgencyaccountSidebarRuntime = updateAgencyaccountSidebarRuntime;


    // --- Dynamically load Sortable.js ---
    (function loadSortable() {
        if (!window.Sortable) { // Only load if not already loaded
            const script = document.createElement('script');
            script.src = "https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js";
            script.onload = () => {
                //log("Sortable.js loaded successfully!");
                // ✅ You can now initialize Sortable here or later in your code
            };
            document.head.appendChild(script);
        }
    })();
    
    (function loadFontAwesome() {
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
            link.crossOrigin = "anonymous";
            link.referrerPolicy = "no-referrer";
            document.head.appendChild(link);
        }
    })();
    window.addEventListener("load", () => {
        waitForSidebarMenus(() => {
            // ✅ Apply locked menus or other functions if needed
            applyLockedMenus();

            // ✅ Apply saved menu customizations (icons + titles)
            const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
            const menuCustomizations = savedTheme.themeData?.["--menuCustomizations"]
                ? JSON.parse(savedTheme.themeData["--menuCustomizations"])
                : {};

            Object.keys(menuCustomizations).forEach(menuId => {
                const custom = menuCustomizations[menuId];
                const menuEl = document.getElementById(menuId);
                if (!menuEl) return;

                // Remove old icons
                menuEl.querySelectorAll("i, img").forEach(el => el.remove());

                // Insert new icon
                const navTitle = menuEl.querySelector(".nav-title");
                if (custom.icon) {
                    const iconEl = document.createElement("i");
                    iconEl.className = custom.icon;
                    iconEl.style.marginRight = "8px";
                    if (navTitle) menuEl.insertBefore(iconEl, navTitle);
                    else menuEl.prepend(iconEl);
                }

                // Update title
                if (navTitle && custom.title) navTitle.textContent = custom.title;
            });

            // ✅ Apply other theme customizations
            applyMenuCustomizations();
        });
    });
    // ✅ Create Loader Inside Theme Builder Drawer Only
    function createTBLoader() {
        if (document.getElementById("tb-loader-overlay")) return;

        const drawer = document.getElementById("themeBuilderDrawer");
        if (!drawer) return;

        const overlay = document.createElement("div");
        overlay.id = "tb-loader-overlay";
        overlay.style.display = "none"; // ✅ hidden by default
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0,0,0,0.6)";
        overlay.style.zIndex = "99999";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.borderRadius = "10px";

        const loader = document.createElement("div");
        loader.className = "loader";
        overlay.appendChild(loader);

        drawer.appendChild(overlay);
    }
    function createSuccessGIF() {
        if (document.getElementById("tb-success-overlay")) return;

        const drawer = document.getElementById("themeBuilderDrawer");
        if (!drawer) return;

        const overlay = document.createElement("div");
        overlay.id = "tb-success-overlay";
        overlay.style.display = "none";
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0,0,0,0.6)";
        overlay.style.zIndex = "100000";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.borderRadius = "10px";

        const successGif = document.createElement("img");
        successGif.src = "https://themebuilder-two.vercel.app/images/check_mark.gif";
        successGif.style.width = "150px";
        successGif.style.height = "150px";
        successGif.style.objectFit = "contain";

        overlay.appendChild(successGif);
        drawer.appendChild(overlay);
    }
        async function ensureThemesCache() {
    if (window.__themesCache) return window.__themesCache;
    if (window.__themesCachePromise) return window.__themesCachePromise;
    window.__themesCachePromise = fetch("https://themebuilder-two.vercel.app/api/theme/getallthemes")
        .then(r => r.json())
        .then(data => {
            const map = {};
            (data.themes || []).forEach(t => { map[t.themeName] = t.themeData; });
            window.__themesCache = map;
            return map;
        })
        .catch(err => {
            console.error("[ThemeBuilder] failed to load themes cache", err);
            return {};
        });
    return window.__themesCachePromise;
}
    ensureThemesCache();

    function isSubaccountThemeActive() {
    try {
        if (typeof getCurrentLocationId !== "function") return false;
        const locationId = getCurrentLocationId();
        if (!locationId) return false;
        const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const raw = saved.themeData?.["--subaccountThemes"];
        if (!raw) return false;
        const sub = JSON.parse(raw);
        return !!(sub && sub[locationId] && sub[locationId].themeName);
    } catch (e) { return false; }
    }
    window.isSubaccountThemeActive = isSubaccountThemeActive;

    // 🔒 Safe writer for userTheme — preserves keys owned by other parts of the app
    function saveUserTheme(savedThemeObj) {
        const prev = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const prevData = prev.themeData || {};
        const newThemeData = (savedThemeObj && savedThemeObj.themeData) || {};
        const next = {
            ...savedThemeObj,
            themeData: {
                ...prevData,
                ...newThemeData,
                "--subaccountThemes":
                    newThemeData["--subaccountThemes"] ?? prevData["--subaccountThemes"],
                "--menuCustomizations":
                    newThemeData["--menuCustomizations"] ?? prevData["--menuCustomizations"],
                "--subMenuOrder":
                    newThemeData["--subMenuOrder"] ?? prevData["--subMenuOrder"],
            },
        };
        localStorage.setItem("userTheme", JSON.stringify(next));
    }
    /**************************************
    * JC Confirm Modal Function
    **************************************/
    function showJCConfirm(message, onYes, onNo) {
        // Check if modal already exists
        let modal = document.getElementById("jc-confirm-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "jc-confirm-modal";
            modal.className = "jc-confirm-modal-overlay"; // overlay covers drawer

            // Modal content inside overlay
            modal.innerHTML = `
            <div class="jc-confirm-modal-content">
                <p id="jc-confirm-message"></p>
                <button id="jc-yes-btn">Yes</button>
                <button id="jc-no-btn">No</button>
            </div>
        `;

            // Append modal inside Theme Builder Drawer
            const drawer = document.getElementById("themeBuilderDrawer") || document.body;
            drawer.appendChild(modal);
        }

        // Set the message
        modal.querySelector("#jc-confirm-message").textContent = message;

        // Show modal
        modal.style.display = "flex";

        const yesBtn = modal.querySelector("#jc-yes-btn");
        const noBtn = modal.querySelector("#jc-no-btn");

        // Remove previous event listeners
        yesBtn.replaceWith(yesBtn.cloneNode(true));
        noBtn.replaceWith(noBtn.cloneNode(true));

        modal.querySelector("#jc-yes-btn").addEventListener("click", () => {
            modal.style.display = "none";

            const yesBtn = modal.querySelector("#jc-yes-btn");
            yesBtn.disabled = true; // ✅ Prevent double click

            const successOverlay = document.getElementById("tb-success-overlay");
            successOverlay.style.display = "flex";

            setTimeout(() => {
                successOverlay.style.display = "none";
                yesBtn.disabled = false; // Enable again if needed
                onYes && onYes();
            }, 800);
        });

        modal.querySelector("#jc-no-btn").addEventListener("click", () => {
            modal.style.display = "none";
            onNo && onNo();
        });
    }


    // Load CSS for Theme Builder
    function loadThemeBuilderCSS() {
    // ✅ Inject critical positioning CSS inline — never rely on external file for this
    if (!document.getElementById('tb-critical-css')) {
        const style = document.createElement('style');
        style.id = 'tb-critical-css';
        style.textContent = `
            .tb-drawer {
            position: fixed; /* so it can move anywhere */
            top: 50px;
            right: 20px;
            width: 320px;
            background: #1e1e1e;
            border: 1px solid #444;
            border-radius: 8px;
            transition: transform 0.3s ease;
        }

            .tb-drawer.open {
                display: block;
            }

        .tb-drawer-header {
            cursor: move; /* show draggable cursor */
            background: #333;
            padding: 10px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 23px;
        }
        .tb-drawer-card {
            background-color: #ffffff;
            margin: 2px 2px 1px 1px;
            border-radius: 13px;
            padding: 16px 6px 0px 7px;
            display: flex;
            flex-direction: column;
            height: auto;
            box-shadow: 0px 0 5px rgb(237 237 237);
        }
             .tb-drawer.open {
        display: block;
    }
        /*Hello Harry*/
#themeBuilderDrawer {
    position: fixed;
    top: 50px;
    right: -420px;
    width: 420px;
    max-width: 90%;
    height: auto;
    /* 25% active color, 75% white */
    background: linear-gradient(to bottom, var(--themebuildermaincolor, #459459) 40%, #ffffff 0%);
    box-shadow: 3px 0px 19px var(--themebuildermaincolor , #459459); /* ✅ Works */
    transition: right 0.48s ease;
    z-index: 99999;
    padding: 16px 7px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
}

    #themeBuilderDrawer.open {
        border-radius: 14px;
        right: 10px;
        border: none ;
    }
/* Drawer header */
    #themeBuilderDrawer > div:first-child {
        font-size: 32px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: left;
        position: relative;
        padding: 14px 16px;
    }

    /* Only style the close button */
    #themeBuilderDrawer .tb-drawer-close {
        position: absolute;
        right: 0px;
        top: 8%;
        transform: translateY(-50%);
        font-size: 28px;
        background: none;
        cursor: var(--custom-pointer) !important;
        color: #ffffff;
        border-radius: 21px;
        padding: 0px 5px 0px 5px;
    }
    #themeBuilderDrawer.closing {
        right: -420px;
        transition: right 0.4s ease; /* slightly slower close transition */
    }
        `;
        document.head.appendChild(style);
        }
        // Then load external CSS for the rest of the styling
        if (!document.getElementById('themeBuilderCSS')) {
            const link = document.createElement('link');
            link.id = 'themeBuilderCSS';
            link.rel = 'stylesheet';
            // link.href = 'https://glitch-gone-nu.vercel.app/theme-builder.css';

            link.href = 'https://themebuilder-two.vercel.app/theme-builder.css';
            // link.href = 'https://themebuilder-two.vercel.app/theme-builder-v1.css';

            document.head.appendChild(link);
        }
    }

    loadThemeBuilderCSS();

    function createSection(title, contentBuilder, icon = null) {
        const section = document.createElement("div");
        section.className = "tb-section";

        const header = document.createElement("div");
        header.className = "tb-section-header";
        header.style.cursor = "var(--custom-pointer)";

        // Optional left icon
        if (icon) {
            const iconEl = document.createElement("span");
            iconEl.className = "tb-section-icon";
            iconEl.innerHTML = icon; // can be emoji or FA markup
            header.appendChild(iconEl);
        }

        // Title
        const titleText = document.createElement("span");
        titleText.className = "tb-section-title";
        titleText.innerHTML = title;
        header.appendChild(titleText);

        // Toggle arrow (always at right)
        const toggleIcon = document.createElement("i");
        toggleIcon.className = "fa-solid fa-angle-down tb-toggle-icon";
        header.appendChild(toggleIcon);

        // Section content
        const content = document.createElement("div");
        content.className = "tb-section-content";

        // Click event
        header.addEventListener("click", () => {
            const drawer = header.closest(".tb-drawer-content");

            // Close others
            drawer.querySelectorAll(".tb-section-content.open").forEach(openContent => {
                if (openContent !== content) {
                    openContent.classList.remove("open");
                    openContent.previousSibling.classList.remove("tb-section-header-open");
                    const otherIcon = openContent.previousSibling.querySelector(".tb-toggle-icon");
                    if (otherIcon) otherIcon.className = "fa-solid fa-angle-down tb-toggle-icon";
                    openContent.style.maxHeight = null;
                    openContent.style.overflowY = null;
                }
            });

            // Toggle this one
            content.classList.toggle("open");
            header.classList.toggle("tb-section-header-open", content.classList.contains("open"));

            if (content.classList.contains("open")) {
                // OPEN section
                content.classList.add("open");
                content.style.maxHeight = "290px"; // Fixed open height
                toggleIcon.className = "fa-solid fa-angle-up tb-toggle-icon"; // 🔼

            } else {
                // CLOSE section
                content.style.maxHeight = content.scrollHeight + "px"; // set current height first
                content.offsetHeight; // force reflow
                content.style.maxHeight = "0px";
                content.classList.remove("open");
                toggleIcon.className = "fa-solid fa-angle-down tb-toggle-icon"; // 🔽
            }

        });

        section.appendChild(header);
        section.appendChild(content);
        contentBuilder(content);

        return section;
    }

    function initTooltip(btn, text) {
        const tooltip = document.createElement("div");
        tooltip.className = "tb-tooltip";
        tooltip.textContent = text;
        btn.appendChild(tooltip);
        btn.style.position = 'relative';
        btn.addEventListener("mouseenter", () => tooltip.classList.add("visible"));
        btn.addEventListener("mouseleave", () => tooltip.classList.remove("visible"));
    }

    const cssVarLabels = {
        "--primary-color": "Primary Color",
        "--second-color": "Secondary Color",

        // Sidebar gradient
        "--sidebar-bg-color": "Sidebar BG Start Color",
        "--sidebar-bg-end-color": "Sidebar BG End Color",

        "--sidebar-menu-bg": "Sidebar Menu BG Color",
        "--sidebar-menu-hover-bg": "Menu Hover Color",
        "--sidebar-menu-active-bg": "Menu Active BG Color",

        "--sidebar-menu-color": "Sidebar Text Color",
        "--sidebar-text-hover-color": "Sidebar Text Hover Color",
        "--sidebar-text-active-color": "Sidebar Text Active Color",
        "--sidebar-menu-icon-color": "Sidebar Icon Color",
        "--sidebar-menu-icon-hover-color": "Sidebar Icon Hover Color",
        "--sidebar-menu-icon-active-color": "Sidebar Icon Active Color",
        "--tw-text-opacity-color": "Menu Title Color",
        "--go-back-color": "Back Button Color",
        "--go-back-text-color": "Back Button Text Color",

        // Login page gradient
        "--login-background-gradient-start": "Login BG Start Color",
        "--login-background-gradient-end": "Login BG End Color"
    };
    function createLoginGradientPicker() {
        const wrapper = document.createElement("div");

        // Start Color Picker
        wrapper.appendChild(createColorPicker(
            "Login Background Gradient Start Color",
            null,
            "--login-background-gradient-start",
            updateLoginBackgroundGradient
        ));

        // End Color Picker
        wrapper.appendChild(createColorPicker(
            "Login Background Gradient End Color",
            null,
            "--login-background-gradient-end",
            updateLoginBackgroundGradient
        ));

        return wrapper;
    }
    function updateLoginBackgroundGradient() {
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const selectedtheme = localStorage.getItem("themebuilder_selectedTheme");

        savedThemeObj.themeData = savedThemeObj.themeData || {};

        // Get user-selected colors
        const start = getComputedStyle(document.body)
            .getPropertyValue("--login-background-gradient-start")
            .trim() || "#ffffff";

        const end = getComputedStyle(document.body)
            .getPropertyValue("--login-background-gradient-end")
            .trim() || start;

        let gradient;
      
        gradient = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
        // Apply gradient
        document.body.style.setProperty("--login-background-active", gradient);

        // Save gradient
        savedThemeObj.themeData["--login-background-active"] = gradient;

        // Remove background image (unless Green Night Themes)
        if (selectedtheme !== 'Green Night Theme' && selectedtheme !== 'Default Light Theme') {
            delete savedThemeObj.themeData["--login-background-image"];
        }

        saveUserTheme(savedThemeObj);
    }
    // === Background Image Input ===
    function createLoginBackgroundImageInput() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Login Page Image URL";
        label.className = "tb-color-picker-label";

        // Get stored theme object
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};

        // Pull raw URL (strip any accidental url("..."))
        let storedImage = savedThemeObj.themeData["--login-background-image"] || "";
        storedImage = storedImage.replace(/^url\(["']?|["']?\)$/g, ""); // ✅ cleanup

        const textInput = document.createElement("input");
        textInput.type = "text";
        textInput.className = "tb-logo-input"; // reuse styling
        textInput.placeholder = "Enter image URL";
        textInput.value = storedImage; // ✅ always raw URL
        function applyImage(rawUrl) {
            // ✅ Strip accidental url("...") wrapper before saving
            const cleanUrl = rawUrl.replace(/^url\(["']?|["']?\)$/g, "").trim();
           
                // Save only the raw URL
                savedThemeObj.themeData["--login-background-image"] = `url('${cleanUrl}')`;;
            
            saveUserTheme(savedThemeObj);
        }

        textInput.addEventListener("input", () => {
            applyImage(textInput.value);
        });

        // Apply on load
        applyImage(storedImage);

        wrapper.appendChild(label);
        wrapper.appendChild(textInput);

        return wrapper;
    }
    function createColorPicker(labelText, storageKey, cssVar, applyFn) {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label"); updateLoginBackgroundGradient
        label.textContent = cssVarLabels[cssVar] || labelText;
        label.className = "tb-color-picker-label";

        // 1️⃣ Load saved or fallback color
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};
        let storedColor = themeData[cssVar]
            || getComputedStyle(document.body).getPropertyValue(cssVar).trim()
            || "#007bff00";

        // ✅ Ensure it’s a valid hex code
        if (!/^#[0-9A-F]{6}$/i.test(storedColor)) {
            storedColor = "#007bff00";
        }

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        // 🔹 Make this an editable input field
        const colorCode = document.createElement("input");
        colorCode.type = "text";
        colorCode.className = "tb-color-code";
        colorCode.value = storedColor;
        colorCode.maxLength = 7; // # + 6 hex chars

        // Helper to apply color everywhere
        function applyColor(color) {
            if (!/^#[0-9A-F]{6}$/i.test(color)) return; // only valid hex
            colorInput.value = color;
            colorCode.value = color;

            if (cssVar) document.body.style.setProperty(cssVar, color);
            if (applyFn) applyFn(color);

            // Save to localStorage
            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData[cssVar] = color;
            saveUserTheme(savedThemeObj);
            if (storageKey) localStorage.setItem(storageKey, color);
        }

        // 🎨 When using color picker
        colorInput.addEventListener("input", () => {
            applyColor(colorInput.value);
        });

        // ⌨️ When typing/pasting hex code
        colorCode.addEventListener("input", () => {
            const val = colorCode.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) {
                applyColor(val);
            }
        });

        // Initial apply
        applyColor(storedColor);

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(colorCode);

        return wrapper;
    }

    function applySidebarTextColor(color) {
        const sidebarLinks = document.querySelectorAll('.sidebar-v2 nav a');
        sidebarLinks.forEach(a => {
            a.style.setProperty("color", color, "important");
            const span = a.querySelector('span');
            if (span) span.style.setProperty("color", color, "important");
        });
    }
 
    function forceRemoveBlueWaveTopNav() {
        let attempts = 0;
        const maxAttempts = 20; // 20 × 50ms = 1 second

        const interval = setInterval(() => {
            attempts++;

            const wrapper = document.getElementById("ghl_custom_topnav_wrapper_v4");
            const style = document.getElementById("ghl_custom_topnav_styles_v4");

            if (wrapper) wrapper.remove();
            if (style) style.remove();

            if (attempts >= maxAttempts) {
                clearInterval(interval);
            }

        }, 50);
    }
    function disableBlueWaveTopNav() {
        // ⛔ Stop re-inserting TopNav
        if (window.__BLUEWAVE_OBSERVER__) {
            window.__BLUEWAVE_OBSERVER__.disconnect();
        }
        const wrapper = document.getElementById("ghl_custom_topnav_wrapper_v4");
        const style = document.getElementById("ghl_custom_topnav_styles_v4");

        if (wrapper) wrapper.remove();
        if (style) style.remove();

        // Restore sidebar
        const sidebars = document.querySelectorAll(
            "aside#sidebar-v2, #sidebar-v2, .hl_sidebar, .hl_app_sidebar"
        );

        sidebars.forEach(el => {
            el.style.removeProperty("display");
            el.style.removeProperty("width");
            el.style.removeProperty("min-width");
            el.style.removeProperty("visibility");
            el.style.removeProperty("opacity");
        });

        forceRemoveBlueWaveTopNav();

        forceSidebarOpen();
    }
    function resetGhlSidebar() {
       
        const sidebar = document.querySelector("#sidebar-v2");
        const body = document.body;

        // Remove forced hidden inline styles
        sidebar.style.display = "";
        sidebar.style.width = "";
        sidebar.style.minWidth = "";
        sidebar.style.visibility = "";
        sidebar.style.opacity = "";

        // Remove GHL's collapsed class if it exists
        body.classList.remove("sidebar-collapsed");

        // Reset localStorage collapse state
        localStorage.setItem("sidebarCollapsed", "false");
    }
    function forceSidebarOpen() {
    const sidebar = document.querySelector("#sidebar-v2")
        || document.querySelector(".hl_app_sidebar")
        || document.querySelector(".hl_sidebar");
    if (!sidebar) return;

    // ✅ Apply once only — no observer needed, no loop possible
    sidebar.style.setProperty("display", "block", "important");
    sidebar.style.setProperty("width", "14rem", "important");
    sidebar.style.setProperty("min-width", "14rem", "important");
    sidebar.style.setProperty("visibility", "visible", "important");
    sidebar.style.setProperty("opacity", "1", "important");
}
    let mainCssLoaded = false;
    function loadMainCSS() {
        if (mainCssLoaded) return; // 🚀 prevent re-loading

        const existing = document.getElementById("main-css-link");
        if (existing) return; // already loaded via <link>

        const link = document.createElement("link");
        link.id = "main-css-link";
        link.rel = "stylesheet";
        link.href = "https://themebuilder-two.vercel.app/main.css";

        document.head.appendChild(link);

        mainCssLoaded = true;
    }

       async function loadThemes() {
        try {
            const res = await fetch("https://themebuilder-two.vercel.app/api/theme/getallthemes");
            const data = await res.json();

            // Convert array to key-value by themeName
            data.themes.forEach(t => {
                themes[t.themeName] = t.themeData;
            });
        } catch (err) {
            console.error("❌ Failed to load themes:", err);
        }
    }

    loadThemes();

    function applySubaccountTheme() {
        const locationId = getCurrentLocationId();
        if (!locationId) return;

        const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
        if (!saved.themeData || !saved.themeData["--subaccountThemes"]) return;

        let subaccountThemes;
        try { subaccountThemes = JSON.parse(saved.themeData["--subaccountThemes"]); }
        catch (e) { return; }

        const locationTheme = subaccountThemes[locationId];
        if (!locationTheme) return;

        const themesMap = window.__themesCache || {};
        const subVars = locationTheme.themeName ? themesMap[locationTheme.themeName] : null;

        const root = document.documentElement;

        if (subVars && typeof subVars === "object") {
            Object.keys(subVars).forEach(key => {
                if (key.startsWith("--") && typeof subVars[key] === "string") {
                    try { root.style.setProperty(key, subVars[key], "important"); } catch (e) {}
                    try { document.body.style.setProperty(key, subVars[key], "important"); } catch (e) {}
                }
            });
        } else if (locationTheme.themeName && typeof ensureThemesCache === "function") {
            // Cache not ready yet — load it then re-apply
            ensureThemesCache().then(() => applySubaccountTheme());
        }

        // Logo
        if (locationTheme.logoUrl) {
            (function tryApplyLogo(retries) {
                const logoImg = document.querySelector(".agency-logo");
                if (logoImg) {
                    logoImg.src = locationTheme.logoUrl;
                    logoImg.style.objectFit = "contain";
                } else if (retries > 0) {
                    setTimeout(() => tryApplyLogo(retries - 1), 300);
                }
            })(15);
            root.style.setProperty("--agency-logo-url", locationTheme.logoUrl);
            if (typeof changeFavicon === "function") changeFavicon(locationTheme.logoUrl);
        }
    }
    function buildThemeSelectorSection(container) {
        if (!container) return;
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const selectedtheme = localStorage.getItem("themebuilder_selectedTheme");
        // inject minimal styles once
        if (!document.getElementById("tb-theme-selector-styles")) {
            const s = document.createElement("style");
            s.id = "tb-theme-selector-styles";
            s.textContent = `
        .themeSelectWrapper{position:relative;display:inline-flex;align-items:center}
        .tb-theme-cycle-btn{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;border:none;cursor:'var(--custom-pointer)';font-weight:600;min-width:160px;justify-content:space-between}
        .themeBtnInner{display:flex;align-items:center;gap:8px;width:100%}
        .themeBtnText{flex:1;text-align:left}
        .themeArrowIcon{width:28px;height:28px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;border:1px solid rgba(0,0,0,0.08);font-size:12px;cursor:pointer}
        `;
            document.head.appendChild(s);
        }

        // Build DOM
        const wrapper = document.createElement("div");
        wrapper.className = "themeSelectWrapper";

        const themeBtn = document.createElement("button");
        themeBtn.className = "tb-theme-cycle-btn";
        themeBtn.type = "button";

        const inner = document.createElement("div");
        inner.className = "themeBtnInner";

        const textSpan = document.createElement("span");
        textSpan.className = "themeBtnText";
        textSpan.textContent = selectedtheme || "Select Theme";

        // circle icon (Font Awesome expected to be loaded separately)

        const arrowIcon = document.createElement("span");
        arrowIcon.className = "themeArrowIcon";
        arrowIcon.innerHTML = '<i class="fa-solid fa-angle-down" aria-hidden="true"></i>';

        // dropdown container
        const dropdownBox = document.createElement("div");
        dropdownBox.className = "themeDropdownBox";

        inner.appendChild(textSpan);
        inner.appendChild(arrowIcon);
        themeBtn.appendChild(inner);

        wrapper.appendChild(themeBtn);
        wrapper.appendChild(dropdownBox);
        container.appendChild(wrapper);
        // Themes object (kept from your original)
        // const themes = darkthemes();
        // const themeKeys = Object.keys(themes);
        // let currentIndex = -1;
        
        // apply theme (merges theme vars into saved themeData to avoid overwriting other keys)
        async function applyTheme(themeName, themeVars) {
            const vars = themeVars || themes[themeName];
            if (!vars) return;

             const subActive = isSubaccountThemeActive();
            if (!subActive) {
                Object.entries(vars).forEach(([key, value]) => {
                    if (value && value !== "undefined") {
                        document.body.style.setProperty(key, value);
                    }
                });
            } else {
                // Make sure the subaccount theme is (re)applied to :root so the UI reflects it.
                if (typeof applySubaccountTheme === "function") applySubaccountTheme();
            }

            // Apply theme variables
            // Object.entries(vars).forEach(([key, value]) => {
            //     if (value && value !== "undefined") {
            //         document.body.style.setProperty(key, value);
            //     }
            // });

            // Update UI
            textSpan.textContent = themeName;
            themeBtn.style.backgroundColor = vars["--primary-color"] || "#007bff00";
            themeBtn.style.color = "#fff";

            // Save
            const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
            // 🧹 Remove mode before merging
            if (savedThemeObj.themeData && savedThemeObj.themeData["--theme-mode"]) {
                delete savedThemeObj.themeData["--theme-mode"];
            }

            // Merge and save
            // Preserve these keys — they must never be overwritten by a theme change
            const keysToPreserve = ["--lockedMenus", "--hiddenMenus", "--agencyLockedHideMenus", "--menuCustomizations"];
            const preserved = {};
            keysToPreserve.forEach(key => {
                if (savedThemeObj.themeData && savedThemeObj.themeData[key] !== undefined) {
                    preserved[key] = savedThemeObj.themeData[key];
                }
            });

            // Merge theme vars, then restore preserved keys on top so they can never be overwritten
            savedThemeObj.themeData = { ...(savedThemeObj.themeData || {}), ...vars, ...preserved };
            savedThemeObj.selectedTheme = themeName;

            saveUserTheme(savedThemeObj);
            localStorage.setItem("themebuilder_selectedTheme", themeName);
            // injectMenuConfigIntoTheme();
            window.dispatchEvent(new Event("themeChanged"));
            // ----------------------------------------------
            // 🔵 APPLY TOP NAV FOR BlueWave TopNav Theme ONLY
            // ----------------------------------------------
            const isSubAccount = window.location.pathname.startsWith("/v2/location/");

            if (themeName === "BlueWave TopNav Theme" && isSubAccount) {
                window.__BLUEWAVE_TOPNAV_ENABLED__ = true;
                // enableBlueWaveTopNav();
            } else {
                window.__BLUEWAVE_TOPNAV_ENABLED__ = false;
                resetGhlSidebar();
                disableBlueWaveTopNav();
            }
        }
        function applyNoneTheme() {
            const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
            const currentThemeData = savedThemeObj.themeData || {};

            // Keys to keep (non-theme customizations)
            const keysToPreserve = ["--lockedMenus", "--hiddenMenus", "--agencyLockedHideMenus", "--menuCustomizations"];
            const preserved = {};
            keysToPreserve.forEach(key => {
                if (currentThemeData[key] !== undefined) {
                    preserved[key] = currentThemeData[key];
                }
            });

            // Remove all theme CSS variables from body
            Object.keys(currentThemeData).forEach(key => {
                if (!keysToPreserve.includes(key)) {
                    document.body.style.removeProperty(key);
                }
            });

            // Reset button UI
            textSpan.textContent = "None";
            themeBtn.style.backgroundColor = "";
            themeBtn.style.color = "";

            // Save — only preserve non-theme keys, clear selectedTheme
            savedThemeObj.themeData = preserved;
            savedThemeObj.selectedTheme = "";
            saveUserTheme(savedThemeObj);
            localStorage.setItem("themebuilder_selectedTheme", "");

            // Restore default CSS
            loadMainCSS();

            window.dispatchEvent(new Event("themeChanged"));

            // Reset BlueWave if active
            window.__BLUEWAVE_TOPNAV_ENABLED__ = false;
            resetGhlSidebar();
            disableBlueWaveTopNav();
        }
        // restore saved theme if exists
        // if (selectedtheme) {
        //     applyTheme(selectedtheme, savedThemeObj.themeData);
        // } else {
        //     textSpan.textContent = "None";
        // }
        if (selectedtheme) {
            if (isSubaccountThemeActive()) {
                // Show the agency name in the dropdown but do NOT write agency vars to <body>.
                textSpan.textContent = selectedtheme;
                const vars = savedThemeObj.themeData || {};
                themeBtn.style.backgroundColor = vars["--primary-color"] || "#007bff00";
                themeBtn.style.color = "#fff";
                if (typeof applySubaccountTheme === "function") applySubaccountTheme();
            } else {
                applyTheme(selectedtheme, savedThemeObj.themeData);
            }
        } else {
            textSpan.textContent = "None";
        }

        // cycle themes when clicking main area of button (but not when clicking the arrow)
        // themeBtn.addEventListener("click", (e) => {
        //     // if the click target is the arrow or inside it, ignore (arrow handles dropdown)
        //     if (e.target.closest(".themeArrowIcon")) return;
        //     currentIndex = (currentIndex + 1) % themeKeys.length;
        //     applyTheme(themeKeys[currentIndex], null);
        // });

        // populate dropdown
        // themeKeys.forEach(themeName => {
        //     const optBtn = document.createElement("button");
        //     optBtn.type = "button";
        //     optBtn.textContent = themeName;
        //     optBtn.addEventListener("click", async (ev) => {
        //         ev.stopPropagation();
        //         if(!selectedtheme){
        //             loadMainCSS();
        //         }
        //         applyTheme(themeName,null);
        //         dropdownBox.classList.remove("show");
        //         arrowIcon.innerHTML = '<i class="fa-solid fa-angle-down" aria-hidden="true"></i>';
        //     });
        //     dropdownBox.appendChild(optBtn);
        // });

        // arrow toggles dropdown
        // arrowIcon.addEventListener("click", (ev) => {
        //     ev.stopPropagation();
        //     const open = dropdownBox.classList.toggle("show");
        //     arrowIcon.innerHTML = open ? '<i class="fa-solid fa-angle-up" aria-hidden="true"></i>' : '<i class="fa-solid fa-angle-down" aria-hidden="true"></i>';
        // });
        // arrow toggles dropdown — fetches themes fresh on each open
        arrowIcon.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            const isOpen = dropdownBox.classList.contains("show");

            if (isOpen) {
                // Close
                dropdownBox.classList.remove("show");
                arrowIcon.innerHTML = '<i class="fa-solid fa-angle-down" aria-hidden="true"></i>';
                return;
            }

            // Show spinner while loading
            arrowIcon.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';
            dropdownBox.innerHTML = '';
            dropdownBox.classList.add("show");

            try {
                    if (Object.keys(themes).length === 0) {
                        arrowIcon.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>';
                        const res = await fetch("https://themebuilder-two.vercel.app/api/theme/getallthemes");
                        const data = await res.json();
                        data.themes.forEach(t => {
                            themes[t.themeName] = t.themeData;
                        });
                    }

                    // Restore arrow to up state (spinner or not, set to up)
                    arrowIcon.innerHTML = '<i class="fa-solid fa-angle-up" aria-hidden="true"></i>';

                    // Populate dropdown fresh
                    dropdownBox.innerHTML = "";
                    // Add "None" option at top
                   
                        // const noneBtn = document.createElement("button");
                        // noneBtn.type = "button";
                        // noneBtn.textContent = "None";
                        // noneBtn.style.fontStyle = "italic";
                        // noneBtn.style.color = "#888";
                        // noneBtn.addEventListener("click", (ev) => {
                        //     ev.stopPropagation();
                        //     applyNoneTheme();
                        //     dropdownBox.classList.remove("show");
                        //     arrowIcon.innerHTML = '<i class="fa-solid fa-angle-down" aria-hidden="true"></i>';
                        // });
                        // dropdownBox.appendChild(noneBtn);
                    

                    Object.keys(themes).forEach(themeName => {
                        const optBtn = document.createElement("button");
                        optBtn.type = "button";
                        optBtn.textContent = themeName;
                        optBtn.addEventListener("click", async (ev) => {
                            ev.stopPropagation();
                            if (!localStorage.getItem("themebuilder_selectedTheme")) {
                                loadMainCSS();
                            }
                            applyTheme(themeName, null);
                            dropdownBox.classList.remove("show");
                            arrowIcon.innerHTML = '<i class="fa-solid fa-angle-down" aria-hidden="true"></i>';
                        });
                        dropdownBox.appendChild(optBtn);
                    });

                    if (Object.keys(themes).length === 0) {
                        dropdownBox.innerHTML = '<div style="padding:10px;font-size:13px;color:#888;">No themes found.</div>';
                    }
                } catch (err) {
                    console.error("❌ Failed to load themes:", err);
                    arrowIcon.innerHTML = '<i class="fa-solid fa-angle-up" aria-hidden="true"></i>';
                    dropdownBox.innerHTML = '<div style="padding:10px;font-size:13px;color:red;">Failed to load themes. Try again.</div>';
                }
        });

        // close when clicking outside
        document.addEventListener("click", (ev) => {
            if (!wrapper.contains(ev.target)) {
                dropdownBox.classList.remove("show");
                arrowIcon.innerHTML = '<i class="fa-solid fa-angle-down" aria-hidden="true"></i>';
            }
        });

        // prevent accidental form submit if in a form
        themeBtn.addEventListener("keydown", (ev) => {
            if (ev.key === " " || ev.key === "Enter") {
                ev.preventDefault();
                themeBtn.click();
            }
        });
    }

    function buildThemeColorsSection(container) {
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};

        // Editable colors grouped
        const editableColors = [
            "--primary-color",
            "--second-color",
            "--sidebar-bg-color",
            "--sidebar-bg-end-color", // new: end color for sidebar gradient
            "--sidebar-menu-bg",
            "--sidebar-menu-hover-bg",
            "--sidebar-menu-active-bg",
            "--sidebar-menu-color",
            "--sidebar-text-hover-color",
            "--sidebar-text-active-color",
            "--sidebar-menu-icon-color",
            "--sidebar-menu-icon-hover-color",
            "--sidebar-menu-icon-active-color",
            "--tw-text-opacity-color",
            "--go-back-color",
            "--go-back-text-color"
        ];

        function updateSidebarGradient() {
            const sidebarStart = getComputedStyle(document.body).getPropertyValue("--sidebar-bg-color").trim() || "#000000";
            const sidebarEnd = getComputedStyle(document.body).getPropertyValue("--sidebar-bg-end-color").trim() || sidebarStart;

            const gradient = `linear-gradient(to bottom, ${sidebarStart}, ${sidebarEnd})`;
            document.body.style.setProperty("--sidebar-main-bg-gradient", gradient);
        }

        editableColors.forEach((key, index) => {
            // --- Add headings at specific points ---
            if (index === 0) {
                // Before Primary & Secondary
                const header = document.createElement("h4");
                header.className = "tb-header-controls";
                header.textContent = "Main Theme Colors";
                container.appendChild(header);
            }

            if (key === "--sidebar-bg-color") {
                // Before Sidebar Colors
                const header = document.createElement("h4");
                header.className = "tb-header-controls";
                header.textContent = "Sidebar Colors";
                container.appendChild(header);
            }

            // --- Determine initial value and apply it to document so createColorPicker picks it up ---
            const value = localStorage.getItem(key) || themeData[key] || "#000000";
            document.body.style.setProperty(key, value);

            // --- Create Picker ---
            let label = key;
            if (key === "--sidebar-bg-color") label = "Choose Sidebar BG Start Color";
            if (key === "--sidebar-bg-end-color") label = "Choose Sidebar BG End Color";

            const picker = createColorPicker(key, label, key, (val) => {
                document.body.style.setProperty(key, val);

                if (key === "--sidebar-bg-color" || key === "--sidebar-bg-end-color") {
                    updateSidebarGradient();
                }
            });

            container.appendChild(picker);
        });

        // --- Initial Gradient Apply ---
        updateSidebarGradient();
    }
    function findControlsContainer() {
        const header = document.querySelector('header.hl_header') || document.querySelector('header');
        if (!header) return null;
        const controls = header.querySelectorAll('.hl_header--controls');
        if (!controls || !controls.length) return null;
        return Array.from(controls).sort((a, b) => b.childElementCount - a.childElementCount)[0];
    }
    function buildFontFamilySelector(wrapper) {
        const label = document.createElement("label");
        label.textContent = "Font Family";
        label.className = "tb-font-label";

        const select = document.createElement("select");
        select.className = "tb-font-select";

        const fonts = [
            "Arial",
            "Verdana",
            "Tahoma",
            "Georgia",
            "Times New Roman",
            "Courier New",
            "Trebuchet MS",
            "Comic Sans MS",
            "Poppins",
            "Roboto",
            "Open Sans",
            "Lato",
            "Montserrat",
            "Ubuntu",
            "Source Sans Pro",
            "Noto Sans",
            "Inter",
            "Playfair Display",
            "Merriweather",
            "Raleway",
            "Nunito",
            "Work Sans",
            "Rubik",
            "Mulish",
            "Kanit",
            "Oswald",
            "Quicksand",
            "Fira Sans",
            "PT Sans",
            "Josefin Sans",
            "Inconsolata",
            "Manrope",
            "Overpass",
            "Cabin",
            "Asap",
            "Barlow",
            "Heebo",
            "Exo 2",
            "Hind",
            "Karla",
            "Titillium Web",
            "DM Sans",
            "Zilla Slab"
        ];

        fonts.forEach(font => {
            const option = document.createElement("option");
            option.value = font;
            option.textContent = font.split(",")[0]; // show first name
            option.style.fontFamily = font; // preview in dropdown
            select.appendChild(option);
        });

        // Load from localStorage if exists
        const savedFont = localStorage.getItem("--body-font");
        if (savedFont) {
            select.value = savedFont;
            document.body.style.setProperty("--body-font", savedFont);
        }

        // Apply instantly when changed
        select.addEventListener("change", () => {
            const font = select.value;
            document.body.style.setProperty("--body-font", font);
            localStorage.setItem("--body-font", font); // keep synced
        });

        wrapper.appendChild(label);
        wrapper.appendChild(select);
    }

    function createLoginCardGradientPicker() {
        const wrapper = document.createElement("div");

        // Start Color Picker
        wrapper.appendChild(createColorPicker(
            "Card BG Start Color",
            null,
            "--login-card-bg-gradient-start",
            updateLoginCardBackgroundGradient
        ));

        // End Color Picker
        wrapper.appendChild(createColorPicker(
            "Card BG End Color",
            null,
            "--login-card-bg-gradient-end",
            updateLoginCardBackgroundGradient
        ));

        return wrapper;
    }

    function updateLoginCardBackgroundGradient() {
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};

        // Get current values or fallback
        const start = getComputedStyle(document.body).getPropertyValue("--login-card-bg-gradient-start").trim() || "#565bf0";
        const end = getComputedStyle(document.body).getPropertyValue("--login-card-bg-gradient-end").trim() || "#072340";

        // Build gradient
        const gradient = `linear-gradient(to bottom, ${start}, ${end})`;

        // Apply gradient CSS variable
        document.body.style.setProperty("--login-card-bg-gradient", gradient);

        // Save in localStorage
        savedThemeObj.themeData["--login-card-bg-gradient-start"] = start;
        savedThemeObj.themeData["--login-card-bg-gradient-end"] = end;
        savedThemeObj.themeData["--login-card-bg-gradient"] = gradient;
        saveUserTheme(savedThemeObj);
    }
    function createLoginButtonGradientPicker() {
        const wrapper = document.createElement("div");

        // Start Color Picker
        wrapper.appendChild(createColorPicker(
            "Button Start Color",
            null,
            "--login-button-gradient-start",
            updateLoginButtonGradient
        ));

        // End Color Picker
        wrapper.appendChild(createColorPicker(
            "Button End Color",
            null,
            "--login-button-gradient-end",
            updateLoginButtonGradient
        ));

        return wrapper;
    }

    function updateLoginButtonGradient() {
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};

        const start = getComputedStyle(document.body).getPropertyValue("--login-button-gradient-start").trim() || "#4f46e5";
        const end = getComputedStyle(document.body).getPropertyValue("--login-button-gradient-end").trim() || start;

        // Smooth gradient for button
        const gradient = `linear-gradient(to bottom, ${start} 20%, ${end} 100%)`;

        // Apply to CSS variable
        document.body.style.setProperty("--login-button-bg-gradient", gradient);

        // Save to localStorage
        savedThemeObj.themeData["--login-button-gradient-start"] = start;
        savedThemeObj.themeData["--login-button-gradient-end"] = end;
        savedThemeObj.themeData["--login-button-bg-gradient"] = gradient;

        saveUserTheme(savedThemeObj);
    }

    function createLoginButtonBorderRadiusInput() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Button Border Radius";
        label.className = "tb-color-picker-label";

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        let storedRadius = themeData["--login-button-border-radius"] ||
            getComputedStyle(document.body).getPropertyValue("--login-button-border-radius").trim() ||
            "5px";

        let numericValue = parseInt(storedRadius, 10) || 5;

        const radiusInput = document.createElement("input");
        radiusInput.type = "number";
        radiusInput.min = 0;
        radiusInput.value = numericValue;
        radiusInput.className = "tb-color-code"; // reuse styling

        function applyRadius(val) {
            const radius = `${val}px`;
            document.body.style.setProperty("--login-button-border-radius", radius);

            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData["--login-button-border-radius"] = radius;
            saveUserTheme(savedThemeObj);
        }

        radiusInput.addEventListener("input", () => {
            const val = parseInt(radiusInput.value, 10);
            if (!isNaN(val)) applyRadius(val);
        });

        applyRadius(numericValue);

        wrapper.appendChild(label);
        wrapper.appendChild(radiusInput);

        return wrapper;
    }

    function createLoginButtonFontColorPicker() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Button Text Color";
        label.className = "tb-color-picker-label";

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        let storedColor = themeData["--login-button-text-color"] ||
            getComputedStyle(document.body).getPropertyValue("--login-button-text-color").trim() ||
            "#ffffff";

        if (!/^#[0-9A-F]{6}$/i.test(storedColor)) {
            storedColor = "#ffffff";
        }

        // 🎨 Color picker
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        // 📝 Hex code input
        const colorCode = document.createElement("input");
        colorCode.type = "text";
        colorCode.className = "tb-color-code";
        colorCode.value = storedColor;
        colorCode.maxLength = 7;

        function applyFontColor(color) {
            if (!/^#[0-9A-F]{6}$/i.test(color)) return;
            colorInput.value = color;
            colorCode.value = color;

            document.body.style.setProperty("--login-button-text-color", color);

            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData["--login-button-text-color"] = color;
            saveUserTheme(savedThemeObj);
        }

        colorInput.addEventListener("input", () => applyFontColor(colorInput.value));
        colorCode.addEventListener("input", () => {
            const val = colorCode.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) applyFontColor(val);
        });

        applyFontColor(storedColor);

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(colorCode);

        return wrapper;
    }
    
    function createLoginButtonHoverBgColorPicker() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Button Hover Color";
        label.className = "tb-color-picker-label";

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        let storedColor = themeData["--login-button-hover-bg-color"] ||
            getComputedStyle(document.body).getPropertyValue("--login-button-hover-bg-color").trim() ||
            "#1d4ed8"; // fallback default

        if (!/^#[0-9A-F]{6}$/i.test(storedColor)) {
            storedColor = "#1d4ed8";
        }

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        const colorCode = document.createElement("input");
        colorCode.type = "text";
        colorCode.className = "tb-color-code";
        colorCode.value = storedColor;
        colorCode.maxLength = 7;

        function applyHoverBgColor(color) {
            if (!/^#[0-9A-F]{6}$/i.test(color)) return;
            colorInput.value = color;
            colorCode.value = color;

            document.body.style.setProperty("--login-button-hover-bg-color", color);

            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData["--login-button-hover-bg-color"] = color;
            saveUserTheme(savedThemeObj);
        }

        colorInput.addEventListener("input", () => applyHoverBgColor(colorInput.value));
        colorCode.addEventListener("input", () => {
            const val = colorCode.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) applyHoverBgColor(val);
        });

        applyHoverBgColor(storedColor);

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(colorCode);

        return wrapper;
    }
    function createLoginLinkTextColorPicker() {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper";

        const label = document.createElement("label");
        label.textContent = "Links Text Color";
        label.className = "tb-color-picker-label";

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        let storedColor = themeData["--login-link-text-color"] ||
            getComputedStyle(document.body).getPropertyValue("--login-link-text-color").trim() ||
            "#2563eb"; // default blue

        if (!/^#[0-9A-F]{6}$/i.test(storedColor)) {
            storedColor = "#2563eb";
        }

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        const colorCode = document.createElement("input");
        colorCode.type = "text";
        colorCode.className = "tb-color-code";
        colorCode.value = storedColor;
        colorCode.maxLength = 7;

        function applyLinkTextColor(color) {
            if (!/^#[0-9A-F]{6}$/i.test(color)) return;
            colorInput.value = color;
            colorCode.value = color;

            document.body.style.setProperty("--login-link-text-color", color);

            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData["--login-link-text-color"] = color;
            saveUserTheme(savedThemeObj);
        }

        colorInput.addEventListener("input", () => applyLinkTextColor(colorInput.value));
        colorCode.addEventListener("input", () => {
            const val = colorCode.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) applyLinkTextColor(val);
        });

        applyLinkTextColor(storedColor);

        wrapper.appendChild(label);
        wrapper.appendChild(colorInput);
        wrapper.appendChild(colorCode);

        return wrapper;
    }

    function addLoaderColorSettings(container) {
        if (document.getElementById("tb-loader-color-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-settings";
        wrapper.id = "tb-loader-color-settings";

        // 🏷️ Title
        const title = document.createElement("h4");
        title.className = "tb-header-controls";
        title.innerText = "Loader Colors";
        wrapper.appendChild(title);

        // ℹ️ Instruction
        const instruction = document.createElement("p");
        instruction.className = "tb-instruction-text";
        instruction.textContent =
            "🎨 Set loader dot color and background gradient.";
        wrapper.appendChild(instruction);

        // 🧠 Theme
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        // =========================
        // Helpers
        // =========================
        function hexToRgb(hex) {
            return [
                parseInt(hex.substr(1, 2), 16),
                parseInt(hex.substr(3, 2), 16),
                parseInt(hex.substr(5, 2), 16)
            ].join(", ");
        }

        function rgbToHex(rgb) {
            const parts = rgb.split(",").map(v => parseInt(v.trim(), 10));
            return (
                "#" +
                parts.map(v => v.toString(16).padStart(2, "0")).join("")
            );
        }

        // =========================
        // 🔵 Loader Dot Color
        // =========================
        let storedRgb =
            themeData["--loader-color-rgb"] ||
            getComputedStyle(document.body).getPropertyValue("--loader-color-rgb") ||
            "255, 255, 255";

        let dotHex = rgbToHex(storedRgb);

        const dotWrapper = document.createElement("div");
        dotWrapper.className = "tb-color-picker-wrapper";

        const dotLabel = document.createElement("label");
        dotLabel.className = "tb-color-picker-label";
        dotLabel.textContent = "Loader Dot Color";

        const dotInput = document.createElement("input");
        dotInput.type = "color";
        dotInput.className = "tb-color-input";
        dotInput.value = dotHex;

        const dotCode = document.createElement("input");
        dotCode.type = "text";
        dotCode.className = "tb-color-code";
        dotCode.value = dotHex;

        function applyDot(hex) {
            if (!/^#[0-9A-F]{6}$/i.test(hex)) return;
            document.body.style.setProperty("--loader-color-rgb", hexToRgb(hex));
            themeData["--loader-color-rgb"] = hexToRgb(hex);
            saveUserTheme(savedThemeObj);
            dotInput.value = dotCode.value = hex;
        }

        dotInput.oninput = () => applyDot(dotInput.value);
        dotCode.oninput = () => applyDot(dotCode.value);

        applyDot(dotHex);

        dotWrapper.append(dotLabel, dotInput, dotCode);
        wrapper.appendChild(dotWrapper);

        // =========================
        // 🌈 Loader Background Gradient
        // =========================
        let startColor = "#000000";
        let endColor = "#000000";

        const storedGradient = themeData["--loader-background-color"];
        if (storedGradient?.includes("#")) {
            const matches = storedGradient.match(/#[0-9A-F]{6}/gi);
            if (matches?.length >= 2) {
                startColor = matches[0];
                endColor = matches[1];
            }
        }

        function applyGradient() {
            const gradient = `linear-gradient(135deg, ${startColor}, ${endColor})`;
            document.body.style.setProperty("--loader-background-color", gradient);
            themeData["--loader-background-color"] = gradient;
            saveUserTheme(savedThemeObj);
        }

        // 🟢 START COLOR PICKER
        const startWrapper = document.createElement("div");
        startWrapper.className = "tb-color-picker-wrapper";

        const startLabel = document.createElement("label");
        startLabel.className = "tb-color-picker-label";
        startLabel.textContent = "Loader Background Start Color";

        const startInput = document.createElement("input");
        startInput.type = "color";
        startInput.className = "tb-color-input";
        startInput.value = startColor;

        const startCode = document.createElement("input");
        startCode.type = "text";
        startCode.className = "tb-color-code";
        startCode.value = startColor;

        startInput.oninput = () => {
            startColor = startCode.value = startInput.value;
            applyGradient();
        };

        startCode.oninput = () => {
            if (/^#[0-9A-F]{6}$/i.test(startCode.value)) {
                startColor = startInput.value = startCode.value;
                applyGradient();
            }
        };

        startWrapper.append(startLabel, startInput, startCode);

        // 🔵 END COLOR PICKER
        const endWrapper = document.createElement("div");
        endWrapper.className = "tb-color-picker-wrapper";

        const endLabel = document.createElement("label");
        endLabel.className = "tb-color-picker-label";
        endLabel.textContent = "Loader Background End Color";

        const endInput = document.createElement("input");
        endInput.type = "color";
        endInput.className = "tb-color-input";
        endInput.value = endColor;

        const endCode = document.createElement("input");
        endCode.type = "text";
        endCode.className = "tb-color-code";
        endCode.value = endColor;

        endInput.oninput = () => {
            endColor = endCode.value = endInput.value;
            applyGradient();
        };

        endCode.oninput = () => {
            if (/^#[0-9A-F]{6}$/i.test(endCode.value)) {
                endColor = endInput.value = endCode.value;
                applyGradient();
            }
        };

        endWrapper.append(endLabel, endInput, endCode);

        applyGradient();

        wrapper.append(startWrapper, endWrapper);
        container.appendChild(wrapper);
    }

    function createLoginHeadingControls() {
        const wrapper = document.createElement("div");

        // Shared savedThemeObj (only once!)
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        // === Font Size Input ===
        const sizeWrapper = document.createElement("div");
        sizeWrapper.className = "tb-color-picker-wrapper";

        const sizeLabel = document.createElement("label");
        sizeLabel.textContent = "Heading Font Size (px)";
        sizeLabel.className = "tb-color-picker-label";

        let storedSize =
            themeData["--login-headline-font-size"] ||
            getComputedStyle(document.body).getPropertyValue("--login-headline-font-size").trim() ||
            "24px";
        let numericSize = parseInt(storedSize, 10) || 24;

        const sizeInput = document.createElement("input");
        sizeInput.type = "number";
        sizeInput.min = 10;
        sizeInput.value = numericSize;
        sizeInput.className = "tb-color-code"; // reuse design

        function applySize(val) {
            const size = `${val}px`;
            document.body.style.setProperty("--login-headline-font-size", size);
            savedThemeObj.themeData["--login-headline-font-size"] = size;
            saveUserTheme(savedThemeObj);
        }

        sizeInput.addEventListener("input", () => {
            const val = parseInt(sizeInput.value, 10);
            if (!isNaN(val)) applySize(val);
        });

        applySize(numericSize);

        sizeWrapper.appendChild(sizeLabel);
        sizeWrapper.appendChild(sizeInput);

        // === Color Picker ===
        const colorWrapper = document.createElement("div");
        colorWrapper.className = "tb-color-picker-wrapper";

        const colorLabel = document.createElement("label");
        colorLabel.textContent = "Heading Text Color";
        colorLabel.className = "tb-color-picker-label";

        let storedColor =
            themeData["--login-headline-text-color"] ||
            getComputedStyle(document.body).getPropertyValue("--login-headline-text-color").trim() ||
            "#000000";
        if (!/^#[0-9A-F]{6}$/i.test(storedColor)) storedColor = "#000000";

        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = storedColor;
        colorInput.className = "tb-color-input";

        const colorCode = document.createElement("input");
        colorCode.type = "text";
        colorCode.className = "tb-color-code";
        colorCode.value = storedColor;
        colorCode.maxLength = 7;

        function applyColor(color) {
            if (!/^#[0-9A-F]{6}$/i.test(color)) return;
            colorInput.value = color;
            colorCode.value = color;
            document.body.style.setProperty("--login-headline-text-color", color);
            savedThemeObj.themeData["--login-headline-text-color"] = color;
            saveUserTheme(savedThemeObj);
        }

        colorInput.addEventListener("input", () => applyColor(colorInput.value));
        colorCode.addEventListener("input", () => {
            const val = colorCode.value.trim();
            if (/^#[0-9A-F]{6}$/i.test(val)) applyColor(val);
        });

        applyColor(storedColor);

        colorWrapper.appendChild(colorLabel);
        colorWrapper.appendChild(colorInput);
        colorWrapper.appendChild(colorCode);

        //// === Heading Text Input ===
        //const textWrapper = document.createElement("div");
        //textWrapper.className = "tb-color-picker-wrapper";

        //const textLabel = document.createElement("label");
        //textLabel.textContent = "Heading Text";
        //textLabel.className = "tb-color-picker-label";

        //let storedText =
        //    themeData["--login-headline-text"] ||
        //    "Sign into your account";

        //const textInput = document.createElement("input");
        //textInput.type = "text";
        //textInput.className = "tb-logo-input"; // reuse styling
        //textInput.value = storedText;

        //function applyText(text) {
        //    // 1️⃣ Apply to CSS variable
        //    // Trim whitespace
        //    text = text.trim();

        //    // 1️⃣ Wrap in quotes only if not already wrapped
        //    let cssText = text;
        //    if (!/^".*"$/.test(text)) { // regex checks if text starts and ends with "
        //        cssText = `"${text}"`;
        //    }

        //    // 1️⃣ Apply to CSS variable
        //    document.body.style.setProperty("--login-headline-text", cssText);

        //    // 2️⃣ Apply to actual heading DOM if it exists
        //    const heading = document.querySelector(".hl_login .hl_login--body .login-card-heading h2");
        //    if (heading) heading.textContent = text;

        //    // 3️⃣ Save in localStorage
        //    savedThemeObj.themeData["--login-headline-text"] = cssText; // save with quotes
        //    saveUserTheme(savedThemeObj);
        //}

        //// Save live while typing
        //textInput.addEventListener("input", () => {
        //    applyText(textInput.value.trim());
        //});

        //// Apply immediately on load
        //applyText(storedText);

        //textWrapper.appendChild(textLabel);
        //textWrapper.appendChild(textInput);

        //textWrapper.appendChild(textLabel);
        //textWrapper.appendChild(textInput);

        // Put them together
        wrapper.appendChild(sizeWrapper);
        wrapper.appendChild(colorWrapper);
        //wrapper.appendChild(textWrapper);

        return wrapper;
    }
    function createLoginLogoInput(labelText, cssVar) {
        const wrapper = document.createElement("div");
        wrapper.className = "tb-color-picker-wrapper"; // you can reuse wrapper style

        const label = document.createElement("label");
        label.textContent = labelText;
        label.className = "tb-color-picker-label";
        wrapper.appendChild(label);

        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Paste logo URL here";
        input.className = "tb-logo-input";

        // Load saved value from userTheme
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};
        const savedLogo = themeData[cssVar] ? themeData[cssVar].replace(/^url\(["']?/, '').replace(/["']?\)$/, '') : '';
        input.value = savedLogo;

        // Update CSS variable on input change
        input.addEventListener("input", () => {
            const url = input.value.trim();
            const value = url ? `url(${url})` : "";
            document.body.style.setProperty(cssVar, value);

            // Save to localStorage
            const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData[cssVar] = value;
            saveUserTheme(savedThemeObj);
        });

        wrapper.appendChild(input);
        return wrapper;
    }
    function openLoginPreview() {
    document.getElementById("tb-login-preview-modal")?.remove();
    const overlay = document.createElement("div");
    overlay.id = "tb-login-preview-modal";
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;z-index:999999;";
    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    // Card container
    const card = document.createElement("div");
    card.style.cssText = "position:relative;border-radius:14px;width:92%;max-width:1100px;height:86vh;overflow:hidden;box-shadow:0 30px 70px rgba(0,0,0,0.55);display:flex;flex-direction:column;";
    // Title bar
    const titleBar = document.createElement("div");
    titleBar.style.cssText = "display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:#1a1a1a;flex-shrink:0;";
    const titleText = document.createElement("span");
    titleText.textContent = "Login Page Preview";
    titleText.style.cssText = "color:#fff;font-size:14px;font-weight:600;";
    // X close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&#10005;";
    closeBtn.title = "Close";
    closeBtn.style.cssText = "width:28px;height:28px;border-radius:50%;border:none;background:rgba(255,255,255,0.12);color:#fff;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;";
    closeBtn.onmouseover = () => closeBtn.style.background = "rgba(255,255,255,0.25)";
    closeBtn.onmouseleave = () => closeBtn.style.background = "rgba(255,255,255,0.12)";
    closeBtn.onclick = () => overlay.remove();
    titleBar.appendChild(titleText);
    titleBar.appendChild(closeBtn);
    const iframe = document.createElement("iframe");
    iframe.id = "tb-login-preview-iframe";
    iframe.style.cssText = "flex:1;width:100%;border:none;background:#0f1722;";
    card.appendChild(titleBar);
    card.appendChild(iframe);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
    buildLoginPreviewContent(iframe);
    // Auto-refresh when theme changes (same-tab color pickers)
    let lastSnapshot = localStorage.getItem("userTheme");
    const pollInterval = setInterval(() => {
        if (!document.getElementById("tb-login-preview-modal")) {
            clearInterval(pollInterval);
            return;
        }
        const current = localStorage.getItem("userTheme");
        if (current !== lastSnapshot) {
            lastSnapshot = current;
            const f = document.getElementById("tb-login-preview-iframe");
            if (f) buildLoginPreviewContent(f);
        }
    }, 700);
    // Also respond to themeChanged event
    function onThemeChange() {
        if (!document.getElementById("tb-login-preview-modal")) {
            window.removeEventListener("themeChanged", onThemeChange);
            return;
        }
        const f = document.getElementById("tb-login-preview-iframe");
        if (f) buildLoginPreviewContent(f);
    }
    window.addEventListener("themeChanged", onThemeChange);
    }
    async function buildLoginPreviewContent(iframe) {
    const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
    const themeData = savedTheme.themeData || {};
    const logoUrl = themeData['--login-company-logo'] ||
                    getComputedStyle(document.documentElement).getPropertyValue('--login-company-logo').trim() || '';

    // ── Read ALL CSS currently active in the browser ──────────────────────────
    // This pulls the exact same CSS the browser already applied — no fetch needed
    let allCSS = '';

    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
        try {
            // Same-origin sheets: read rules directly
            const rules = Array.from(sheet.cssRules || sheet.rules || []);
            for (const rule of rules) {
                allCSS += rule.cssText + '\n';
            }
        } catch (e) {
            // Cross-origin sheet: try fetching it
            if (sheet.href) {
                try {
                    const res = await fetch(sheet.href, { credentials: 'include' });
                    if (res.ok) allCSS += await res.text() + '\n';
                } catch (fetchErr) {
                    // Silently skip truly inaccessible sheets
                }
            }
        }
    }

    // ── Build the preview HTML with the full browser CSS injected ─────────────
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" crossorigin="anonymous">
<style>
/* ── Full browser CSS (same as live page) ── */
${allCSS}
</style>
<style>
/* ===============================
   PAGE BACKGROUND
================================ */
html, body {
  height: 100%;
  margin: 0;
  background: var(--login-background-active,#e5e7ea) !important;
}

/* ===============================
   CENTER LOGIN WRAPPER
================================ */

/* BODY BACKGROUND */
.hl_login {
  background: linear-gradient(135deg, #0F1722 0%, #1F2A38 50%, #EF3E6C 100%) !important;
  font-family: 'Poppins', sans-serif !important;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
}

/* CENTER CARD */
.hl_login .card {
  background: var(--card-bg) !important;
  backdrop-filter: blur(15px);
  border-radius: 20px !important;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6) !important;
  width: 460px !important;
  border: 1px solid rgba(255,255,255,0.05);
}

/* CARD BODY */
.hl_login .card-body {
  padding: 35px !important;
}

/* HEADINGS */
.login-card-heading h2 {
  color: var(--primary) !important;
  font-size: 28px !important;
  font-weight: 600;
  text-align: center;
}

.login-card-heading h4 {
  color: var(--text-muted) !important;
  text-align: center;
}

/* INPUT LABEL */
.hl-text-input-label {
  color: var(--text-muted) !important;
}

/* INPUT FIELD */
.hl-text-input {
  background: var(--input-bg) !important;
  border: 1px solid var(--input-border) !important;
  border-radius: 10px !important;
  color: var(--text-light) !important;
  padding: 12px 14px !important;
  transition: all 0.3s ease;
}

/* INPUT FOCUS */
.hl-text-input:focus {
  border-color: var(--primary) !important;
  box-shadow: 0 0 0 2px rgba(239, 62, 108, 0.2) !important;
}

/* PLACEHOLDER */
.hl-text-input::placeholder {
  color: #6B7280 !important;
}

/* FORGOT PASSWORD */
.forgot-password {
  color: var(--primary) !important;
  transition: 0.3s;
}

.forgot-password:hover {
  color: #ff6f91 !important;
}

/* BUTTON */
.hl-btn {
  background: linear-gradient(90deg, #EF3E6C, #ff6f91) !important;
  border-radius: 12px !important;
  font-weight: 500;
  padding: 12px !important;
  transition: all 0.3s ease;
  border: none !important;
}

/* BUTTON HOVER */
.hl-btn:hover {
  background: #ff6f91 !important;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(239, 62, 108, 0.4);
}

/* DIVIDER TEXT */
.hl_login .text-gray-500 {
  color: var(--text-muted) !important;
}

/* FOOTER TEXT */
.foot-note {
  color: var(--text-muted) !important;
  text-align: center;
}

/* LINKS */
.foot-note a {
  color: var(--primary) !important;
}

/* GOOGLE BUTTON FIX */
#g_id_signin iframe {
  border-radius: 10px !important;
  overflow: hidden;
}

/* HEADER BAR */
.hl_login--header {
  background: transparent !important;
}

/* LANGUAGE DROPDOWN */
.language-dropdown-container select {
  background: #111827 !important;
  color: white !important;
  border-radius: 8px !important;
  border: 1px solid #2D3748 !important;
}

/* SMOOTH ANIMATION */
.hl_login .card {
  animation: fadeUp 0.6s ease;
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Make whole layout vertical */
.hl_login {
  flex-direction: column !important;
  justify-content: flex-start !important;
  padding-top: 40px;
}

/* HEADER CONTAINER */
.hl_login--header .container-fluid {
  flex-direction: column !important;
  align-items: center !important;
  position: relative;
}

/* LOGO CENTER TOP */
.hl_login--header a {
  margin-bottom: 20px;
}

/* LANGUAGE TOP RIGHT */
.language-dropdown-container {
  position: absolute;
  top: 0;
  right: 20px;
}

/* REMOVE HEADER HEIGHT LIMIT */
.hl_login--header .container-fluid {
  min-height: auto !important;
}

/* CENTER BODY */
.hl_login--body {
  display: flex;
  justify-content: center;
  width: 100%;
}


</style>
</head>
<body>
  <div class="hl_login">
    <div class="hl_login--header">
      <div class="container-fluid">
        ${logoUrl
            ? `<img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'">`
            : `<span class="logo-placeholder">Your Logo</span>`}
        <div class="language-dropdown-container">
          <select><option>English</option></select>
        </div>
      </div>
    </div>
    <div class="hl_login--body">
      <div class="card">
        <div class="card-body">
          <div class="login-card-heading">
            <h2>Sign In</h2>
            <h4>Welcome back! Please enter your details.</h4>
          </div>
          <div class="form-group">
            <label class="hl-text-input-label">Email</label>
            <input type="email" class="hl-text-input" placeholder="you@example.com">
          </div>
          <div class="form-group">
            <label class="hl-text-input-label">Password</label>
            <input type="password" class="hl-text-input" placeholder="••••••••">
          </div>
          <div class="forgot-row">
            <a class="forgot-password" href="#">Forgot Password?</a>
          </div>
          <button class="hl-btn">Log In</button>
          <div class="divider">
            <hr><span>or continue with</span><hr>
          </div>
          <div class="google-btn-placeholder">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
              <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
              <path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.826.957 4.038l3.007-2.332z"/>
              <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Sign in with Google
          </div>
          <p class="foot-note">By signing in, you agree to our <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a></p>
        </div>
      </div>
    </div>
  </div>
</body>
    </html>`;

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();
    }
    function buildHeaderControlsSection(container) {
        const section = document.createElement("div");
        section.className = "tb-controls-section";
        section.dataset.section = "header-gradient";

        // === Section Title ===
        const header = document.createElement("h4");
        header.className = "tb-header-controls";
        header.textContent = "Header Color";
        section.appendChild(header);

        // === Gradient Controls Wrapper ===
        const gradientWrapper = document.createElement("div");
        gradientWrapper.className = "tb-gradient-controls";

        // === Load saved state ===
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        // === Disable logic ===
        const disabledThemes = ["Green Night Theme", "OceanMist Theme","Default Theme"]; // example themes that disable header editing

        function shouldDisableHeaderSection() {
            const selectedTheme = localStorage.getItem("themebuilder_selectedTheme") || "";
            return disabledThemes.includes(selectedTheme);
        }

        function toggleDisableState() {
            const disable = shouldDisableHeaderSection();
            const inputs = section.querySelectorAll("input, select, button, textarea");

            inputs.forEach((input) => {
                input.disabled = disable;
                input.style.cursor = disable ? "not-allowed" : "pointer";
            });

            section.style.opacity = disable ? "0.6" : "1";
            section.style.pointerEvents = disable ? "none" : "auto";
            // pointer-events none will block all interaction
            // opacity gives visual feedback
        }

        // ✅ If themeData has a gradient string, extract start & end colors
        if (themeData["--header-main-bg-gradient"]) {
            const gradient = themeData["--header-main-bg-gradient"];
            const colors = gradient.match(/#([0-9A-F]{6})/gi);

            const selectedTheme = localStorage.getItem("themebuilder_selectedTheme") || "";

            if (colors && colors.length >= 2) {
                if (selectedTheme === "VelvetNight Theme") {
                    // ✅ FIRST and LAST colors only
                    themeData["--header-gradient-start"] = colors[0];
                    themeData["--header-gradient-end"] = colors[colors.length - 1];
                } else {
                    // ✅ Normal themes
                    themeData["--header-gradient-start"] = colors[0];
                    themeData["--header-gradient-end"] = colors[1];
                }
            }
        }


        const headerEl = document.querySelector(".hl_header");

        // === Update Gradient Preview ===
        // function updateGradientPreview() {
        //     if (!headerEl || !startPicker || !endPicker) return;

        //     const start = startPicker.input.value;
        //     const end = endPicker.input.value;

        //     const stop = 0;
        //     const angle = 90;

        //     const gradient = `linear-gradient(${angle}deg, ${start} ${stop}%, ${end} 100%)`;

        //     document.body.style.setProperty("--header-gradient-start", start);
        //     document.body.style.setProperty("--header-gradient-end", end);
        //     document.body.style.setProperty("--header-gradient-stop", stop + "%");
        //     document.body.style.setProperty("--header-gradient-angle", angle + "deg");
        //     document.body.style.setProperty("--header-main-bg-gradient", gradient);

        //     headerEl.style.setProperty("background", "none", "important");
        //     headerEl.style.setProperty("background-image", "var(--header-main-bg-gradient)", "important");
        // }
        function updateGradientPreview() {
            if (!headerEl || !startPicker || !endPicker) return;

            const start = startPicker.input.value;
            const end = endPicker.input.value;

            const selectedTheme = localStorage.getItem("themebuilder_selectedTheme") || "";

            let gradient;

            if (selectedTheme === "VelvetNight Theme") {
                // ✅ Special velvet gradient with white separator
                gradient = `
                    linear-gradient(
                        225deg,
                        ${start} 22%,
                        #FFFFFF 22%,
                        #F6F2FA 23%,
                        ${end} 23%
                    )
                `;
            } else {
                // ✅ Default behavior for all other themes
                const stop = 0;
                const angle = 90;
                gradient = `linear-gradient(${angle}deg, ${start} ${stop}%, ${end} 100%)`;

                document.body.style.setProperty("--header-gradient-stop", stop + "%");
                document.body.style.setProperty("--header-gradient-angle", angle + "deg");
            }

            // ✅ Apply CSS variables
            document.body.style.setProperty("--header-gradient-start", start);
            document.body.style.setProperty("--header-gradient-end", end);
            document.body.style.setProperty("--header-main-bg-gradient", gradient.trim());

            // ✅ Force header background
            headerEl.style.setProperty("background", "none", "important");
            headerEl.style.setProperty(
                "background-image",
                "var(--header-main-bg-gradient)",
                "important"
            );

            // ✅ Persist
            savedThemeObj.themeData = savedThemeObj.themeData || {};
            savedThemeObj.themeData["--header-main-bg-gradient"] = gradient.trim();
            saveUserTheme(savedThemeObj);
        }


        // === Color picker helper ===
        function makePicker(labelText, cssVar, fallback = "#007bff00") {
            const wrapper = document.createElement("div");
            wrapper.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            let initial =
                themeData[cssVar] ||
                getComputedStyle(document.body).getPropertyValue(cssVar).trim() ||
                fallback;

            if (!/^#[0-9A-F]{6}$/i.test(initial)) {
                initial = fallback;
            }

            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";
            colorInput.value = initial;

            const colorCode = document.createElement("input");
            colorCode.type = "text";
            colorCode.className = "tb-color-code";
            colorCode.value = initial;
            colorCode.maxLength = 7;

            function applyColor(color) {
                if (!/^#[0-9A-F]{6}$/i.test(color)) return;

                colorInput.value = color;
                colorCode.value = color;

                document.body.style.setProperty(cssVar, color);

                savedThemeObj.themeData = savedThemeObj.themeData || {};
                savedThemeObj.themeData[cssVar] = color;
                saveUserTheme(savedThemeObj);

                updateGradientPreview();
            }

            colorInput.addEventListener("input", () => applyColor(colorInput.value));
            colorCode.addEventListener("input", () => {
                const val = colorCode.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    applyColor(val);
                }
            });

            setTimeout(() => applyColor(initial), 0);

            wrapper.appendChild(label);
            wrapper.appendChild(colorInput);
            wrapper.appendChild(colorCode);

            return { wrapper, input: colorInput, code: colorCode };
        }

        // === Create Inputs ===
        const startPicker = makePicker("Start Color For Header", "--header-gradient-start", "#ffffff");
        const endPicker = makePicker("End Color For Header", "--header-gradient-end", "#ffffff");

        gradientWrapper.appendChild(startPicker.wrapper);
        gradientWrapper.appendChild(endPicker.wrapper);

        const instruction = document.createElement("p");
        instruction.className = "tb-instruction-text";
        instruction.textContent =
            "💡 For Flat Color in Header: Choose the same color for Start & End";
        gradientWrapper.appendChild(instruction);

        section.appendChild(gradientWrapper);
        container.appendChild(section);

        // Initial Preview
        updateGradientPreview();

        // ✅ Initial disable state check
        toggleDisableState();

        // === 💡 Runtime theme change listener ===
        window.addEventListener("themeChanged", toggleDisableState);

        return section;
    }
    function buildProfileButtonControls(section) {
        const profileWrapper = document.createElement("div");
        profileWrapper.className = "tb-profile-btn-controls";

        const title = document.createElement("h4");
        title.className = "tb-profile-title";
        title.textContent = "Profile Button";
        profileWrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        const selector = ".container-fluid .hl_header--controls .avatar .avatar_img";

        // helper: inject isolated CSS for profile button only
        function setImportantStyle(id, rule) {
            let styleTag = document.getElementById("style-" + id);
            if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = "style-" + id;
                document.head.appendChild(styleTag);
            }
            styleTag.textContent = rule;
        }

        // helper: color picker with input for hex
        function makePicker(labelText, key, fallback, applyFn) {
            const wrapper = document.createElement("div");
            wrapper.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";

            let initial = themeData[key] || fallback;
            if (!/^#[0-9A-F]{6}$/i.test(initial)) initial = fallback;
            colorInput.value = initial;

            // Editable hex input
            const colorCode = document.createElement("input");
            colorCode.type = "text";
            colorCode.className = "tb-color-code";
            colorCode.value = initial;
            colorCode.maxLength = 7;

            // Apply color helper
            function applyColor(val) {
                if (!/^#[0-9A-F]{6}$/i.test(val)) return;
                colorInput.value = val;
                colorCode.value = val;

                savedThemeObj.themeData = savedThemeObj.themeData || {};
                savedThemeObj.themeData[key] = val;
                saveUserTheme(savedThemeObj);

                applyFn(val);
            }

            // Initial apply
            applyColor(initial);

            // Event listeners
            colorInput.addEventListener("input", () => applyColor(colorInput.value));
            colorCode.addEventListener("input", () => {
                const val = colorCode.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    applyColor(val);
                }
            });

            wrapper.appendChild(label);
            wrapper.appendChild(colorInput);
            wrapper.appendChild(colorCode);

            return wrapper;
        }

        // === Icon Color ===
        profileWrapper.appendChild(
            makePicker("Icon Color", "profile-icon-color", "#8d4e4e", (val) => {
                setImportantStyle(
                    "profile-icon-color",
                    `${selector} { color: ${val} !important; }`
                );
            })
        );

        // === Icon Hover Color ===
        profileWrapper.appendChild(
            makePicker("Icon Hover Color", "profile-icon-hover", "#aa6666", (val) => {
                setImportantStyle(
                    "profile-icon-hover",
                    `${selector}:hover { color: ${val} !important; }`
                );
            })
        );

        // === Background Color ===
        profileWrapper.appendChild(
            makePicker("Background Color", "profile-bg-color", "#344391", (val) => {
                setImportantStyle(
                    "profile-bg-color",
                    `${selector} { background-color: ${val} !important; }`
                );
            })
        );

        // === Background Hover Color ===
        profileWrapper.appendChild(
            makePicker("Background Hover Color", "profile-bg-hover", "#1f2c66", (val) => {
                setImportantStyle(
                    "profile-bg-hover",
                    `${selector}:hover { background-color: ${val} !important; }`
                );
            })
        );

        section.appendChild(profileWrapper);
    }
    function buildHelpButtonControls(section) {
        const helpWrapper = document.createElement("div");
        helpWrapper.className = "tb-help-btn-controls";

        const title = document.createElement("h4");
        title.className = "tb-help-title";
        title.textContent = "Header Buttons";
        helpWrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        // helper: create color picker with editable hex input
        function makePicker(labelText, key, fallback, cssVar) {
            const wrapper = document.createElement("div");
            wrapper.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";

            let initial = themeData[key] || fallback;
            if (!/^#[0-9A-F]{6}$/i.test(initial)) initial = fallback;
            colorInput.value = initial;

            // Editable hex input
            const colorCode = document.createElement("input");
            colorCode.type = "text";
            colorCode.className = "tb-color-code";
            colorCode.value = initial;
            colorCode.maxLength = 7;

            // Apply color helper
            function applyColor(val) {
                if (!/^#[0-9A-F]{6}$/i.test(val)) return;
                colorInput.value = val;
                colorCode.value = val;

                savedThemeObj.themeData = savedThemeObj.themeData || {};
                savedThemeObj.themeData[key] = val;
                saveUserTheme(savedThemeObj);

                document.body.style.setProperty(cssVar, val);
            }

            // Initial apply
            applyColor(initial);

            // Event listeners
            colorInput.addEventListener("input", () => applyColor(colorInput.value));
            colorCode.addEventListener("input", () => {
                const val = colorCode.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    applyColor(val);
                }
            });

            wrapper.appendChild(label);
            wrapper.appendChild(colorInput);
            wrapper.appendChild(colorCode);

            return wrapper;
        }

        // === Icon Color ===
        helpWrapper.appendChild(
            makePicker("Icon Color", "help-icon-color", "#ffffff", "--header-icon-color")
        );

        // === Icon Hover Color ===
        helpWrapper.appendChild(
            makePicker("Icon Hover Color", "help-icon-hover", "#eeeeee", "--header-icon-hover")
        );

        // === Background Color ===
        helpWrapper.appendChild(
            makePicker("Background Color", "help-bg-color", "#188bf6", "--header-icon-bg")
        );

        // === Background Hover Color ===
        helpWrapper.appendChild(
            makePicker("Background Hover Color", "help-bg-hover", "#146cc0", "--header-icon-hover-bg")
        );

        section.appendChild(helpWrapper);
    }
    function addScrollbarSettings(container) {
        if (document.getElementById("tb-scrollbar-settings")) return; // prevent duplicate

        const wrapper = document.createElement("div");
        wrapper.className = "tb-scrollbar-settings";
        wrapper.id = "tb-scrollbar-settings";
        wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-section-scroll-title";
        title.innerText = "Scrollbar Settings";
        wrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function storageKeyFor(key, cssVar) {
            if (cssVar) return cssVar;
            if (key && key.startsWith("--")) return key;
            return `--${key}`;
        }

        function saveVar(key, value) {
            themeData[key] = value;
            saveUserTheme(savedThemeObj);
            document.body.style.setProperty(key, value);
        }

        function makePicker(labelText, key, fallback, cssVar, transparent20 = false) {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";

            const skey = storageKeyFor(key, cssVar);

            let initial = (themeData[skey] || getComputedStyle(document.body).getPropertyValue(skey) || fallback).toString().trim();
            if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(initial)) initial = fallback;
            colorInput.value = initial;

            // Editable hex input
            const colorCode = document.createElement("input");
            colorCode.type = "text";
            colorCode.className = "tb-color-code";
            colorCode.value = initial;
            colorCode.maxLength = 7;

            function applyValue(val) {
                if (!/^#[0-9A-F]{6}$/i.test(val)) return;

                let finalVal = val;
                if (transparent20) {
                    const bigint = parseInt(val.slice(1), 16);
                    const r = (bigint >> 16) & 255;
                    const g = (bigint >> 8) & 255;
                    const b = bigint & 255;
                    finalVal = `rgba(${r}, ${g}, ${b}, 0.2)`;
                }

                // Apply to CSS variable
                document.body.style.setProperty(skey, finalVal);
                saveVar(skey, finalVal);

                // Sync both inputs
                colorInput.value = val;
                colorCode.value = val;

                // Special case for card header gradient
                if (skey === "--card-header-gradient-start" || skey === "--card-header-gradient-end") {
                    const start = themeData["--card-header-gradient-start"] || "#344391";
                    const end = themeData["--card-header-gradient-end"] || "#1f2c66";
                    const gradient = `linear-gradient(90deg, ${start}, ${end})`;
                    document.body.style.setProperty("--card-header-bg-gradient", gradient);
                    themeData["--card-header-bg-gradient"] = gradient;
                    saveUserTheme(savedThemeObj);
                }
            }

            applyValue(initial);

            // Event listeners
            colorInput.addEventListener("input", () => applyValue(colorInput.value));
            colorCode.addEventListener("input", () => {
                const val = colorCode.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    applyValue(val);
                }
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(colorInput);
            wrapperDiv.appendChild(colorCode);

            return wrapperDiv;
        }

        function makeNumberInput(labelText, cssVar, fallback, min, max) {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-number-input-wrapper";

            const label = document.createElement("label");
            label.className = "tb-number-label";
            label.textContent = labelText;

            const input = document.createElement("input");
            input.type = "number";
            input.className = "tb-number-scroll-input";
            input.min = min;
            input.max = max;

            const saved = themeData[cssVar] || getComputedStyle(document.body).getPropertyValue(cssVar) || fallback;
            const initialNumber = parseInt((saved + "").replace("px", ""), 10) || parseInt(fallback, 10);
            input.value = initialNumber;

            const code = document.createElement("span");
            code.className = "tb-number-code";
            code.textContent = initialNumber + "px";

            document.body.style.setProperty(cssVar, initialNumber + "px");

            input.addEventListener("input", () => {
                const val = (input.value || initialNumber) + "px";
                code.textContent = val;
                saveVar(cssVar, val);
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(input);
            wrapperDiv.appendChild(code);
            return wrapperDiv;
        }

        const controls = document.createElement("div");
        controls.className = "tb-scrollbar-controls";
        wrapper.appendChild(controls);

        controls.appendChild(makePicker("Scrollbar Color", "scroll-color", "#344391", "--scroll-color"));
        //controls.appendChild(makeNumberInput("Scrollbar Width (px)", "--scroll-width", "7px", 2, 30));

        Object.keys(themeData).forEach(k => {
            try { document.body.style.setProperty(k, themeData[k]); } catch (e) { }
        });

        container.appendChild(wrapper);
    }
    function addDashboardCardSettings(container) {
        if (document.getElementById("tb-dashboard-card-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-dashboard-card-settings";
        wrapper.id = "tb-dashboard-card-settings";
        wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-section-dashbaord-title";
        title.innerText = "Dashboard Card Settings";
        wrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function storageKeyFor(key, cssVar) {
            if (cssVar) return cssVar;
            if (key && key.startsWith("--")) return key;
            return `--${key}`;
        }

        function saveVar(key, value) {
            themeData[key] = value;
            saveUserTheme(savedThemeObj);
            document.body.style.setProperty(key, value);
        }
        function updateCardGradient() {
            const start = themeData["--card-header-gradient-start"] || "#344391";
            const end = themeData["--card-header-gradient-end"] || "#1f2c66";

            const selectedTheme = localStorage.getItem("themebuilder_selectedTheme") || "";

            let gradient;

            if (selectedTheme === "VelvetNight Theme") {
                // ✅ Velvet Night: white separator preserved
                gradient = `
                    linear-gradient(
                        225deg,
                        ${start} 22%,
                        #FFFFFF 22%,
                        #F6F2FA 23%,
                        ${end} 23%
                    )
                `.trim();
            } else {
                // ✅ Default behavior
                gradient = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;
            }

            // Apply to card header
            const styleId = "tb-card-gradient-style";
            let styleTag = document.getElementById(styleId);
            if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = styleId;
                document.head.appendChild(styleTag);
            }

            styleTag.innerHTML = `
                .h1-card-header {
                    background-image: ${gradient} !important;
                }
            `;

            // Persist
            saveVar("--card-header-bg-gradient", gradient);
        }

        // function updateCardGradient() {
        //     const start = themeData["--card-header-gradient-start"] || "#344391";
        //     const end = themeData["--card-header-gradient-end"] || "#1f2c66";
        //     const gradient = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;

        //     const styleId = "tb-card-gradient-style";
        //     let styleTag = document.getElementById(styleId);
        //     if (!styleTag) {
        //         styleTag = document.createElement("style");
        //         styleTag.id = styleId;
        //         document.head.appendChild(styleTag);
        //     }
        //     styleTag.innerHTML = `.h1-card-header { background-image: ${gradient} !important; }`;

        //     saveVar("--card-header-bg-gradient", gradient);
        // }

        // === Color Picker helper with synced input ===
        function makePicker(labelText, key, fallback, cssVar, isGradient = false, transparent20 = false) {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";

            const hexInput = document.createElement("input");
            hexInput.type = "text";
            hexInput.className = "tb-color-code";
            hexInput.maxLength = 7;

            const skey = storageKeyFor(key, cssVar);

            let initial = (themeData[skey] || getComputedStyle(document.body).getPropertyValue(skey) || fallback).toString().trim();
            if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(initial)) initial = fallback;

            colorInput.value = initial;
            hexInput.value = initial;

            function applyValue(val) {
                if (!/^#[0-9A-F]{6}$/i.test(val)) return;

                let finalVal = val;
                if (transparent20) {
                    const bigint = parseInt(val.slice(1), 16);
                    const r = (bigint >> 16) & 255;
                    const g = (bigint >> 8) & 255;
                    const b = bigint & 255;
                    finalVal = `rgba(${r}, ${g}, ${b}, 0.2)`;
                }

                document.body.style.setProperty(skey, finalVal);
                saveVar(skey, finalVal);

                // Sync both inputs
                colorInput.value = val;
                hexInput.value = val;

                if (skey === "--card-header-gradient-start" || skey === "--card-header-gradient-end") {
                    updateCardGradient();
                }
            }

            applyValue(initial);

            colorInput.addEventListener("input", () => applyValue(colorInput.value));
            hexInput.addEventListener("input", () => {
                const val = hexInput.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) applyValue(val);
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(colorInput);
            wrapperDiv.appendChild(hexInput);

            return wrapperDiv;
        }

        const gradientControls = document.createElement("div");
        gradientControls.className = "tb-gradient-controls";
        wrapper.appendChild(gradientControls);

        gradientControls.appendChild(
            makePicker("Card Header Start Color", "card-header-gradient-start", "#344391", "--card-header-gradient-start", true)
        );
        gradientControls.appendChild(
            makePicker("Card Header End Color", "card-header-gradient-end", "#1f2c66", "--card-header-gradient-end", true)
        );
        gradientControls.appendChild(
            makePicker("Card Background", "card-body-bg-color", "#ffffff", "--card-body-bg-color")
        );
        gradientControls.appendChild(
            makePicker("Card Title Font Color", "card-title-font-color", "#000000", "--card-title-font-color")
        );
        gradientControls.appendChild(
            makePicker("Card Border Color", "card-body-border-color", "#cccccc", "--card-body-border-color")
        );

        // Number inputs (font size, border radius) remain unchanged
        (function addTitleFontSize() {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-number-input-wrapper";

            const label = document.createElement("label");
            label.className = "tb-number-label";
            label.textContent = "Card Title Font Size (px)";

            const input = document.createElement("input");
            input.type = "number";
            input.className = "tb-number-fond-input";
            input.min = 8;
            input.max = 48;

            const cssVar = "--card-title-font-size";
            const saved = themeData[cssVar] || getComputedStyle(document.body).getPropertyValue(cssVar) || "16px";
            const initialNumber = parseInt((saved + "").replace("px", ""), 10) || 16;
            input.value = initialNumber;

            const code = document.createElement("span");
            code.className = "tb-number-code";
            code.textContent = initialNumber + "px";

            document.body.style.setProperty(cssVar, initialNumber + "px");

            input.addEventListener("input", () => {
                const val = (input.value || initialNumber) + "px";
                code.textContent = val;
                saveVar(cssVar, val);
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(input);
            wrapperDiv.appendChild(code);
            gradientControls.appendChild(wrapperDiv);
        })();

        (function addBorderRadius() {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-number-input-wrapper";

            const label = document.createElement("label");
            label.className = "tb-number-label";
            label.textContent = "Card Border Radius (px)";

            const input = document.createElement("input");
            input.type = "number";
            input.className = "tb-number-radius-input";
            input.min = 0;
            input.max = 50;

            const cssVar = "--card-body-border-radius";
            const saved = themeData[cssVar] || getComputedStyle(document.body).getPropertyValue(cssVar) || "8px";
            const initialNumber = parseInt((saved + "").replace("px", ""), 10) || 8;
            input.value = initialNumber;

            const code = document.createElement("input");
            code.type = "number";
            code.className = "tb-number-code";
            code.value = initialNumber;
            code.min = 0;
            code.max = 50;

            document.body.style.setProperty(cssVar, initialNumber + "px");

            function applyBorderRadius(val) {
                document.body.style.setProperty(cssVar, val + "px");
                saveVar(cssVar, val + "px");
                input.value = val;
                code.value = val;
            }

            input.addEventListener("input", () => applyBorderRadius(input.value));
            code.addEventListener("input", () => applyBorderRadius(code.value));

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(input);
            wrapperDiv.appendChild(code);
            gradientControls.appendChild(wrapperDiv);
        })();

        // Reapply saved vars
        Object.keys(themeData).forEach(k => {
            try {
                document.body.style.setProperty(k, themeData[k]);
            } catch (e) { }
        });

        updateCardGradient();

        container.appendChild(wrapper);
    }
    function addBackgroundGradientSettings(container) {
        if (document.getElementById("tb-bg-gradient-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-bg-gradient-settings";
        wrapper.id = "tb-bg-gradient-settings";
        wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-section-background-title";
        title.innerText = "Dashboard Background Color";
        wrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function saveVar(key, value) {
            themeData[key] = value;
            saveUserTheme(savedThemeObj);
            document.body.style.setProperty(key, value);
        }

        const gradientControls = document.createElement("div");
        gradientControls.className = "tb-gradient-controls";
        wrapper.appendChild(gradientControls);

        function makePicker(labelText, cssVar, fallback) {
            const wrapperDiv = document.createElement("div");
            wrapperDiv.className = "tb-color-picker-wrapper";

            const label = document.createElement("label");
            label.className = "tb-color-picker-label";
            label.textContent = labelText;

            const colorInput = document.createElement("input");
            colorInput.type = "color";
            colorInput.className = "tb-color-input";

            const hexInput = document.createElement("input");
            hexInput.type = "text";
            hexInput.className = "tb-color-code";
            hexInput.maxLength = 7;

            let initial = (themeData[cssVar] || getComputedStyle(document.body).getPropertyValue(cssVar) || fallback).trim();
            if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(initial)) initial = fallback;

            colorInput.value = initial;
            hexInput.value = initial;

            function applyValue(val) {
                if (!/^#[0-9A-F]{6}$/i.test(val)) return;
                saveVar(cssVar, val);
                colorInput.value = val;
                hexInput.value = val;
                updateGradient();
            }

            colorInput.addEventListener("input", () => applyValue(colorInput.value));
            hexInput.addEventListener("input", () => {
                const val = hexInput.value.trim();
                if (/^#[0-9A-F]{6}$/i.test(val)) applyValue(val);
            });

            wrapperDiv.appendChild(label);
            wrapperDiv.appendChild(colorInput);
            wrapperDiv.appendChild(hexInput);

            return wrapperDiv;
        }

        gradientControls.appendChild(makePicker("Background Start Color", "--bg-gradient-start", "#f9fafb"));
        gradientControls.appendChild(makePicker("Background End Color", "--bg-gradient-end", "#e5e7eb"));

        function updateGradient() {
            const start = themeData["--bg-gradient-start"] || "#f9fafb";
            const end = themeData["--bg-gradient-end"] || "#e5e7eb";
            const gradient = `linear-gradient(90deg, ${start} 0%, ${end} 100%)`;

            const styleId = "tb-bg-gradient-style";
            let styleTag = document.getElementById(styleId);
            if (!styleTag) {
                styleTag = document.createElement("style");
                styleTag.id = styleId;
                document.head.appendChild(styleTag);
            }
            styleTag.innerHTML = `
          .bg-gray-50 { background: ${gradient} !important; }
          .bg-gray-100 { background: ${gradient} !important; }
      `;

            saveVar("--bg-gradient", gradient);
        }

        updateGradient();

        container.appendChild(wrapper);
    }
    function addCursorSelectorSettings(container) {
        if (document.getElementById("tb-cursor-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-cursor-settings";
        wrapper.id = "tb-cursor-settings";
        // wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-header-controls-cursor";
        title.innerText = "Custom Cursor";
        title.style.cursor = "var(--custom-pointer,auto)"; // make it look clickable
        wrapper.appendChild(title);

        // const arrow = document.createElement("span");
        // arrow.innerHTML = "▶"; // right arrow
        // arrow.style.marginLeft = "8px";
        // title.appendChild(arrow);
           // Arrow Icon (Font Awesome)
        const arrow = document.createElement("span");
        arrow.style.marginLeft = "8px";
        arrow.innerHTML = `<i class="fa-solid fa-angle-down" style="color:white;margin-right:6px;font-size:16px; border-radius: 4px; border: 2px solid #ffffff; padding: 0px 2px 0px 2px;"></i>`; // initial closed
        title.appendChild(arrow);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function saveVar(key, value) {
            if (value) {
                themeData[key] = value;
                saveUserTheme(savedThemeObj);
                document.body.style.setProperty(key, value);
            } else {
                delete themeData[key];
                saveUserTheme(savedThemeObj);
                document.body.style.removeProperty(key);
            }
        }

        
        // --- Cursor Options ---
        const cursorOptions = [
            { name: "Default Cursor", url: "https://themebuilder-two.vercel.app/images/defaultc-cursor.png", isDefault: true },
            { name: "Purple Cursor", url: "https://themebuilder-two.vercel.app/images/purple-cursor.png" },
            { name: "Sky Cursor", url: "https://themebuilder-two.vercel.app/images/sky-cursor.png" },
            { name: "Sky Blue Cursor", url: "https://themebuilder-two.vercel.app/images/skyblue-cusror.png" },
            { name: "Black New Cursor", url: "https://themebuilder-two.vercel.app/images/black-new.png" },
            { name: "Mouse Cursor", url: "https://themebuilder-two.vercel.app/images/mouse-cursor.png" },
            { name: "Purple Gradient Cursor", url: "https://themebuilder-two.vercel.app/images/purplegradient-cursor.png" },
            { name: "Yellow Orange Cursor", url: "https://themebuilder-two.vercel.app/images/yelloworange-cursor.png" },
            { name: "Mouse Sharp Cursor", url: "https://themebuilder-two.vercel.app/images/mousesharp-cursor.png" },
            { name: "Gradient Border Cursor", url: "https://themebuilder-two.vercel.app/images/gradientborder-cursor.png" },
            { name: "Transparent Cursor", url: "https://themebuilder-two.vercel.app/images/transperant-cursor.png" },
            { name: "Classic Cursor", url: "https://themebuilder-two.vercel.app/images/cursor.png" },
            { name: "Target Cursor", url: "https://themebuilder-two.vercel.app/images/target-cursor.png" }
        ];

        const cursorList = document.createElement("div");
        cursorList.className = "tb-cursor-list";
        wrapper.appendChild(cursorList);

        function renderCursorOptions() {
            cursorList.innerHTML = "";

            const savedCursor = themeData["--custom-cursor"];

            cursorOptions.forEach(cursor => {
                const item = document.createElement("div");
                item.className = "tb-cursor-item";
                item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 10px;
                background: #f8f8f8;
                border-radius: 8px;
                padding: 8px 12px;
                margin-bottom: 8px;
                transition: background 0.3s;
            `;
                item.addEventListener("mouseenter", () => (item.style.background = "#f0e6ff"));
                item.addEventListener("mouseleave", () => (item.style.background = "#f8f8f8"));

                const img = document.createElement("img");
                img.className = "tb-cursor-image";
                img.style.width = "24px";
                img.style.height = "24px";
                img.src = cursor.url;

                const label = document.createElement("span");
                label.className = "tb-cursor-label";
                label.textContent = cursor.name;
                label.style.flex = "1";

                const toggle = document.createElement("input");
                toggle.className = "tb-cursor-radiobutton";
                toggle.type = "radio";
                toggle.name = "custom-cursor-toggle";

                // handle default cursor
                let cursorCSS = cursor.isDefault ? "auto" : `url("${cursor.url}") 0 0`;
                toggle.checked = savedCursor === cursorCSS;

                toggle.addEventListener("change", () => {
                    saveVar("--custom-cursor", cursorCSS);
                });

                item.appendChild(img);
                item.appendChild(label);
                item.appendChild(toggle);
                cursorList.appendChild(item);
            });
        }

        renderCursorOptions();
        // --- Toggle cursor list slide on click ---
        title.addEventListener("click", () => {
            const icon = arrow.querySelector("i");

            if (cursorList.classList.contains("open")) {
                cursorList.classList.remove("open");

                icon.classList.remove("fa-angle-up");
                icon.classList.add("fa-angle-down");
            } else {
                cursorList.classList.add("open");

                icon.classList.remove("fa-angle-down");
                icon.classList.add("fa-angle-up");
            }
        });
        // title.addEventListener("click", () => {
        //     cursorList.classList.toggle("open"); // 'open' class triggers CSS slide
        //     arrow.innerHTML = cursorList.classList.contains("open") ? "▼" : "▶";

        // });
        container.appendChild(wrapper);
    }
    function addCursorPointerSelectorSettings(container) {
        if (document.getElementById("tb-cursor-pointer-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-cursor-settings";
        wrapper.id = "tb-cursor-pointer-settings";
        // wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-header-controls-cursor";
        title.innerText = "Custom Pointer";
        title.style.cursor = "var(--custom-pointer,auto)";
        wrapper.appendChild(title);

        const arrow = document.createElement("span");
            arrow.style.marginLeft = "8px";
            arrow.innerHTML = `<i class="fa-solid fa-angle-down" style="color:white;margin-right:6px;font-size:16px; border-radius: 4px; border: 2px solid #ffffff;padding: 0px 2px 0px 2px;"></i>`; // initial closed
            title.appendChild(arrow);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function saveVar(key, value) {
            themeData[key] = value;
            saveUserTheme(savedThemeObj);
            document.body.style.setProperty(key, value);
        }

        const pointerOptions = [
            { name: "Default Pointer", url: "https://themebuilder-two.vercel.app/images/default-pointer.png", isDefault: true },
            { name: "Orange Finger Pointer", url: "https://themebuilder-two.vercel.app/images/orangefinger-pointer.png" },
            { name: "Green Pointer", url: "https://themebuilder-two.vercel.app/images/green-pointer.png" },
            { name: "Black Pointer", url: "https://themebuilder-two.vercel.app/images/black-pointer.png" },
            { name: "Light Orange Pointer", url: "https://themebuilder-two.vercel.app/images/lightorange-pointer.png" },
            { name: "Golden Hand Pointer", url: "https://themebuilder-two.vercel.app/images/goldenhand-pointer.png" },
            { name: "Glow Hand Pointer", url: "https://themebuilder-two.vercel.app/images/glowhand-pointer.png" },
            { name: "Orange R Pointer", url: "https://themebuilder-two.vercel.app/images/oranger-pointer.png" },
            { name: "Sky Blue New Pointer", url: "https://themebuilder-two.vercel.app/images/skybluenew-pointer.png" },
            { name: "Classic Blue Pointer", url: "https://themebuilder-two.vercel.app/images/classicblue-pointer.png" },
            { name: "Black New Pointer", url: "https://themebuilder-two.vercel.app/images/blacknew-pointer.png" },
            { name: "Yellow Orange Pointer", url: "https://themebuilder-two.vercel.app/images/yelloworange-pointer.png" },
            { name: "Hand Pointer", url: "https://themebuilder-two.vercel.app/images/hand-pointer.png" }
        ];

        const pointerList = document.createElement("div");
        pointerList.className = "tb-cursor-list"; // DO NOT set display:none
        wrapper.appendChild(pointerList);

        function renderPointerOptions() {
            pointerList.innerHTML = "";
            const savedPointer = themeData["--custom-pointer"];

            pointerOptions.forEach(pointer => {
                const item = document.createElement("div");
                item.className = "tb-cursor-item";
                item.style.cssText = `
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: #f8f8f8;
                    border-radius: 8px;
                    padding: 8px 12px;
                    margin-bottom: 8px;
                    transition: background 0.3s;
                `;
                item.addEventListener("mouseenter", () => item.style.background = "#fff1e0");
                item.addEventListener("mouseleave", () => item.style.background = "#f8f8f8");

                const img = document.createElement("img");
                img.src = pointer.url;
                img.alt = pointer.name;
                img.style.width = "24px";
                img.style.height = "24px";

                const label = document.createElement("span");
                label.textContent = pointer.name;
                label.style.flex = "1";

                const toggle = document.createElement("input");
                toggle.type = "radio";
                toggle.name = "custom-pointer-toggle";

                const pointerCSS = pointer.isDefault ? "pointer" : `url("${pointer.url}") 0 0, pointer`;
                toggle.checked = savedPointer === pointerCSS;

                toggle.addEventListener("change", () => {
                    saveVar("--custom-pointer", pointerCSS);
                });

                item.appendChild(img);
                item.appendChild(label);
                item.appendChild(toggle);
                pointerList.appendChild(item);
            });
        }

        renderPointerOptions();

        title.addEventListener("click", () => {
                const icon = arrow.querySelector("i");

                if (pointerList.classList.contains("open")) {
                    pointerList.classList.remove("open");

                    icon.classList.remove("fa-angle-up");
                    icon.classList.add("fa-angle-down");
                } else {
                    pointerList.classList.add("open");

                    icon.classList.remove("fa-angle-down");
                    icon.classList.add("fa-angle-up");
                }
            });

        container.appendChild(wrapper);
    }
    async function addLoaderSelectorSettings(container) {
        if (document.getElementById("tb-loader-selector-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-loader-settings";
        wrapper.id = "tb-loader-selector-settings";

        // 🏷️ Title
        const title = document.createElement("h4");
        title.className = "tb-header-controls";
        title.innerText = "Custom Loader";
        wrapper.appendChild(title);

        // ℹ️ Instructions
        const instruction = document.createElement("p");
        instruction.className = "tb-instruction-text";
        instruction.textContent = `
                🧭 Quick Guide:
                1️⃣ Toggle Mode – Turn ON “Use Built-in Loaders” to pick a ready-made loader, or OFF to use your own logo. 
                2️⃣ Company Logo – Enter your logo URL and select an animation (Pulsating or Bouncing). 
                3️⃣ Built-in Loaders – Choose one from the list below when enabled. 
                ⚠️ Tip – Switching between Logo and Built-in modes automatically clears previous settings to avoid conflicts.
                `;
        wrapper.appendChild(instruction);

        // 🧩 Decode agencyId
        let agencyId = null;
        try {
            const encodedAgn = localStorage.getItem("agn");
            if (encodedAgn) agencyId = atob(encodedAgn);
            else throw new Error("agn not found in localStorage");
        } catch (err) {
            console.error("❌ Agency ID decode error:", err);
            wrapper.innerHTML = "<p style='color:red;'>Agency ID missing or invalid.</p>";
            container.appendChild(wrapper);
            return;
        }

        // 🧠 Load theme
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        let storedLogoUrl = themeData["--loader-company-url"] || "";
        storedLogoUrl = storedLogoUrl.replace(/^url\(["']?|["']?\)$/g, "");

        // === Toggle (Mode Switch)
        const modeWrapper = document.createElement("div");
        modeWrapper.className = "tb-mode-toggle";

        const modeLabel = document.createElement("label");
        modeLabel.className = "tb-toggle-label";

        const modeCheckbox = document.createElement("input");
        modeCheckbox.type = "checkbox";
        modeCheckbox.className = "tb-toggle-checkbox";

        const isLoaderMode = !storedLogoUrl;
        modeCheckbox.checked = isLoaderMode;

        const toggleText = document.createElement("span");
        toggleText.textContent = "Use Built-in Loaders";
        modeLabel.appendChild(toggleText);
        modeLabel.appendChild(modeCheckbox);
        modeWrapper.appendChild(modeLabel);
        wrapper.appendChild(modeWrapper);

        // 💾 Save helper
        function saveVar(key, value) {
            if (!value) {
                delete themeData[key];
                document.body.style.removeProperty(key);
            } else {
                themeData[key] = value;
                document.body.style.setProperty(key, value);
            }
            saveUserTheme(savedThemeObj);
        }

        // 🖼️ === Company Logo Card ===
        const card = document.createElement("div");
        card.className = "tb-logo-card";

        const logoLabel = document.createElement("label");
        logoLabel.textContent = "Company Logo URL";
        logoLabel.className = "tb-color-picker-label";

        const logoInput = document.createElement("input");
        logoInput.type = "text";
        logoInput.className = "tb-logo-input-loader";
        logoInput.placeholder = "Enter your company logo URL";
        logoInput.value = storedLogoUrl;

        function applyLogoUrl(rawUrl) {
            const cleanUrl = rawUrl.replace(/^url\(["']?|["']?\)$/g, "").trim();
            if (cleanUrl) {
                saveVar("--loader-company-url", cleanUrl);
            } else {
                saveVar("--loader-company-url", "");
            }
        }

        logoInput.addEventListener("input", () => applyLogoUrl(logoInput.value));
        applyLogoUrl(storedLogoUrl);

        // 🌀 Animation Tabs
        const animationWrapper = document.createElement("div");
        animationWrapper.className = "tb-animation-tabs";

        const pulsatingBtn = document.createElement("button");
        pulsatingBtn.textContent = "Pulsating Logo";
        pulsatingBtn.className = "tb-animation-btn";

        const bouncingBtn = document.createElement("button");
        bouncingBtn.textContent = "Bouncing Logo";
        bouncingBtn.className = "tb-animation-btn";

        const savedAnimation = themeData["--animation-settings"] || "PulsatingLogo";
        if (savedAnimation === "PulsatingLogo") pulsatingBtn.classList.add("active");
        else bouncingBtn.classList.add("active");

        pulsatingBtn.addEventListener("click", () => {
            saveVar("--animation-settings", "PulsatingLogo");
            pulsatingBtn.classList.add("active");
            bouncingBtn.classList.remove("active");
        });

        bouncingBtn.addEventListener("click", () => {
            saveVar("--animation-settings", "BouncingLogo");
            bouncingBtn.classList.add("active");
            pulsatingBtn.classList.remove("active");
        });

        animationWrapper.appendChild(pulsatingBtn);
        animationWrapper.appendChild(bouncingBtn);

        card.appendChild(logoLabel);
        card.appendChild(logoInput);
        card.appendChild(animationWrapper);
        wrapper.appendChild(card);

        // === Loader List ===
        const loaderList = document.createElement("div");
        loaderList.className = "tb-loader-list";
        wrapper.appendChild(loaderList);

        // 🔁 Mode toggle logic
        function updateModeState() {
            const loaderEnabled = modeCheckbox.checked;

            // Enable / disable UI
            logoInput.disabled = loaderEnabled;
            card.classList.toggle("disabled", loaderEnabled);
            loaderList.classList.toggle("disabled", !loaderEnabled);

            // 🧹 Auto-clear inactive data
            if (loaderEnabled) {
                // ✅ Clear logo + animation data
                saveVar("--loader-company-url", "");
                saveVar("--animation-settings", "");
                logoInput.value = "";
                pulsatingBtn.classList.remove("active");
                bouncingBtn.classList.remove("active");
            } else {
                // ✅ Clear built-in loader CSS variable
                saveVar("--loader-css", "");
            }

            // Save mode type
            saveVar("--loader-mode", loaderEnabled ? "loaders" : "logo");
        }

        modeCheckbox.addEventListener("change", updateModeState);
        updateModeState();
        const email = localStorage.getItem("g-em") ? atob(localStorage.getItem("g-em")) : null;
        // 🌍 Fetch loaders
        async function fetchLoaders() {
            try {
                const res = await fetch(
                    `https://themebuilder-two.vercel.app/api/theme/Get-loader-css?email=${email}`
                );
                if (!res.ok) throw new Error("Failed to fetch loaders");
                const data = await res.json();
                renderLoaderOptions(
                data.loaders || [],
                data.activeLoaderId
                );            
                } catch (err) {
                console.error("❌ Error fetching loaders:", err);
                loaderList.innerHTML = "<p class='tb-error-text'>Failed to load loaders.</p>";
            }
        }

        // 🎨 Render loaders
        // function renderLoaderOptions(loaders, activeLoaderId) {
        //     loaderList.innerHTML = "";
        //     const savedLoader =
        //         themeData["--loader-css"] && JSON.parse(themeData["--loader-css"]);

        //     loaders.forEach((loader) => {
        //         const item = document.createElement("div");
        //         item.className = "tb-loader-item";

        //         const img = document.createElement("img");
        //         img.src =
        //             loader.previewImage ||
        //             "https://themebuilder-two.vercel.app/images/dotsloader.png";
        //         img.alt = loader.loaderName;
        //         img.className = "tb-loader-img";

        //         const label = document.createElement("span");
        //         label.textContent = loader.loaderName;
        //         label.className = "tb-loader-label";

        //         const toggle = document.createElement("input");
        //         toggle.type = "radio";
        //         toggle.name = "custom-loader-toggle";
        //         toggle.className = "tb-loader-radio";

        //         // if ((savedLoader && savedLoader._id === loader._id) || loader.isActive)
        //         if ( (savedLoader && savedLoader._id === loader._id) ||  loader._id === activeLoaderId )
        //             toggle.checked = true;

        //         toggle.addEventListener("change", () => {
        //             const loaderData = { _id: loader._id };
        //             saveVar("--loader-css", JSON.stringify(loaderData));
        //         });

        //         item.appendChild(img);
        //         item.appendChild(label);
        //         item.appendChild(toggle);
        //         loaderList.appendChild(item);
        //     });
        // }

        function renderLoaderOptions(loaders, activeLoaderId) {
    loaderList.innerHTML = "";

    // ✅ Safe parse — handles stale/corrupted localStorage values
    let savedLoader = null;
    try {
        const raw = themeData["--loader-css"];
        if (raw) {
            const parsed = JSON.parse(raw);
            // Only treat it as valid if it has an _id (expected shape)
            if (parsed && parsed._id) {
                savedLoader = parsed;
            } else {
                // Stale data (e.g. old CSS text stored here) — clear it
                delete themeData["--loader-css"];
                saveUserTheme(savedThemeObj);
            }
        }
    } catch (e) {
        // Corrupted value — wipe it so it doesn't break again next load
        console.warn("⚠️ --loader-css had invalid JSON, clearing it.", e);
        delete themeData["--loader-css"];
        saveUserTheme(savedThemeObj);
    }

    loaders.forEach((loader) => {
        const item = document.createElement("div");
        item.className = "tb-loader-item";

        const img = document.createElement("img");
        img.src =
            loader.previewImage ||
            "https://themebuilder-two.vercel.app/images/dotsloader.png";
        img.alt = loader.loaderName;
        img.className = "tb-loader-img";

        const label = document.createElement("span");
        label.textContent = loader.loaderName;
        label.className = "tb-loader-label";

        const toggle = document.createElement("input");
        toggle.type = "radio";
        toggle.name = "custom-loader-toggle";
        toggle.className = "tb-loader-radio";

        if ((savedLoader && savedLoader._id === loader._id) || loader._id === activeLoaderId)
            toggle.checked = true;

        toggle.addEventListener("change", () => {
            const loaderData = { _id: loader._id };
            saveVar("--loader-css", JSON.stringify(loaderData));
        });

        item.appendChild(img);
        item.appendChild(label);
        item.appendChild(toggle);
        loaderList.appendChild(item);
    });
}

        await fetchLoaders();
        container.appendChild(wrapper);
    }
    function addLogoUrlInputSetting(container) {
        if (document.getElementById("tb-logo-url-setting")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-logo-url-settings";
        wrapper.id = "tb-logo-url-setting";
        wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-header-controls";
        title.innerText = "Favicon URL";
        wrapper.appendChild(title);

        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function saveLogoVar(key, value) {
            themeData[key] = value;
            saveUserTheme(savedThemeObj);
            document.body.style.setProperty(key, value);
        }

        // Create a "picker‑style" wrapper similar to color picker in scrollbar settings
        const pickerWrapper = document.createElement("div");
        pickerWrapper.className = "tb-color-picker-wrapper"; // reuse same wrapper class
        // Note: in scrollbar settings, color picker wrapper contains a label + inputs side-by-side

        const label = document.createElement("label");
        label.className = "tb-color-picker-label";
        label.textContent = "Favicon URL";
        label.setAttribute("for", "tb-logo-input-field");

        const input = document.createElement("input");
        input.type = "text";
        input.id = "tb-logo-input-field";
        input.className = "tb-logo-input";
        input.placeholder = "https://example.com/favicon.ico";

        const savedLogo = themeData["--custom-logo-url"];
        if (savedLogo) {
            input.value = savedLogo;
        }

        input.addEventListener("change", () => {
            const url = input.value.trim();

            if (!url) {
                saveLogoVar("--custom-logo-url", "");
                saveLogoVar("--custom-logo-css", "");
                return;
            }

            const cssValue = `url("${url}")`;
            saveLogoVar("--custom-logo-url", url);
            saveLogoVar("--custom-logo-css", cssValue);
        });

        input.addEventListener("keypress", e => {
            if (e.key === "Enter") {
                input.blur();
            }
        });

        pickerWrapper.appendChild(label);
        pickerWrapper.appendChild(input);
        wrapper.appendChild(pickerWrapper);

        container.appendChild(wrapper);
    }
    function addLogoSettings(container) {
        if (document.getElementById("tb-logo-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.className = "tb-logo-settings";
        wrapper.id = "tb-logo-settings";
        wrapper.style.marginTop = "16px";

        const title = document.createElement("h4");
        title.className = "tb-header-controls";
        title.innerText = "Sidebar Logo";
        wrapper.appendChild(title);

        // Load saved theme data
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        savedThemeObj.themeData = savedThemeObj.themeData || {};
        const themeData = savedThemeObj.themeData;

        function saveVar(key, value) {
            themeData[key] = value;
            saveUserTheme(savedThemeObj);
            document.body.style.setProperty(key, value);
        }

        function updateSidebarLogo(forceUrl = null) {
            let url = forceUrl;

            if (!url) {
                url = getComputedStyle(document.documentElement)
                    .getPropertyValue("--agency-logo-url")
                    .trim()
                    .replace(/^"|"$/g, "");
            }

            if (!url) return;

            const img = document.querySelector(".agency-logo");
            if (img) {
                img.src = url;
                img.style.objectFit = "contain";
            }
        }



        /* -----------------------------------------
           LOGO URL INPUT
        ----------------------------------------- */
        const logoWrapper = document.createElement("div");
        logoWrapper.className = "tb-color-picker-wrapper";

        const logoLabel = document.createElement("label");
        logoLabel.className = "tb-color-picker-label";
        logoLabel.textContent = "Logo URL";

        const logoInput = document.createElement("input");
        logoInput.type = "text";
        logoInput.className = "tb-logo-input";
        logoInput.placeholder = "https://example.com/logo.png";

        const savedLogo = themeData["--agency-logo-url"] || themeData["--agency-logo"] || "";
        if (savedLogo) {
            let cleanURL = savedLogo.trim()
                .replace(/^url\(/i, "")
                .replace(/\)$/i, "")
                .replace(/^"|"$/g, "")
                .replace(/^'|'$/g, "");
            logoInput.value = cleanURL;
        }

        // logoInput.addEventListener("input", () => {
        //     const url = logoInput.value.trim();
        //     if (!url) return;

        //     // Save both CSS and Raw URL versions
        //     saveVar("--agency-logo", `url("${url}")`);
        //     saveVar("--agency-logo-url", url);

        //     // Update IMG directly
        //     const img = document.querySelector(".agency-logo");
        //     if (img) {
        //         img.src = url;
        //     }
        // });
            logoInput.addEventListener("input", () => {
                const url = logoInput.value.trim();

                if (!url) {
                    // Clear both CSS variables and reset the image
                    saveVar("--agency-logo", "");
                    saveVar("--agency-logo-url", "");

                    const img = document.querySelector(".agency-logo");
                    if (img) {
                        img.src = "";
                    }
                    return;
                }

                saveVar("--agency-logo", `url("${url}")`);
                saveVar("--agency-logo-url", url);

                const img = document.querySelector(".agency-logo");
                if (img) {
                    img.src = url;
                }
            });

        logoWrapper.appendChild(logoLabel);
        logoWrapper.appendChild(logoInput);
        wrapper.appendChild(logoWrapper);
        let tbWidth = parseInt(themeData["--logo-width"]) || 150;
        let tbHeight = parseInt(themeData["--logo-height"]) || 40;

        // --- WIDTH BLOCK ---
        const widthWrapper = document.createElement("div");
        widthWrapper.className = "tb-slider-block";

        // Label
        const widthLabel = document.createElement("label");
        widthLabel.className = "tb-slider-label";
        widthLabel.textContent = "Width";
        widthWrapper.appendChild(widthLabel);

        // Input row
        const widthInputRow = document.createElement("div");
        widthInputRow.className = "tb-input-row";

        const widthInput = document.createElement("input");
        widthInput.type = "number";
        widthInput.min = "0";
        widthInput.value = tbWidth;
        widthInput.className = "tb-size-input";

        const widthPx = document.createElement("span");
        widthPx.textContent = "px";

        widthInputRow.appendChild(widthInput);
        widthInputRow.appendChild(widthPx);
        widthWrapper.appendChild(widthInputRow);

        // Slider
        const widthSlider = document.createElement("input");
        widthSlider.type = "range";
        widthSlider.min = "0";
        widthSlider.max = "100";
        widthSlider.value = tbWidth;
        widthSlider.className = "tb-range-slider";

        widthWrapper.appendChild(widthSlider);


        // --- HEIGHT BLOCK ---
        const heightWrapper = document.createElement("div");
        heightWrapper.className = "tb-slider-block";

        // Label
        const heightLabel = document.createElement("label");
        heightLabel.className = "tb-slider-label";
        heightLabel.textContent = "Height";
        heightWrapper.appendChild(heightLabel);

        // Input row
        const heightInputRow = document.createElement("div");
        heightInputRow.className = "tb-input-row";

        const heightInput = document.createElement("input");
        heightInput.type = "number";
        heightInput.min = "0";
        heightInput.value = tbHeight;
        heightInput.className = "tb-size-input";

        const heightPx = document.createElement("span");
        heightPx.textContent = "px";

        heightInputRow.appendChild(heightInput);
        heightInputRow.appendChild(heightPx);
        heightWrapper.appendChild(heightInputRow);

        // Slider
        const heightSlider = document.createElement("input");
        heightSlider.type = "range";
        heightSlider.min = "0";
        heightSlider.max = "100";
        heightSlider.value = tbHeight;
        heightSlider.className = "tb-range-slider";

        heightWrapper.appendChild(heightSlider);
        function applyLogoSize() {
            const img = document.querySelector(".agency-logo");
            if (!img) return;

            img.style.width = tbWidth + "px";
            img.style.height = tbHeight + "px";

            saveVar("--logo-width", tbWidth + "px");
            saveVar("--logo-height", tbHeight + "px");
        }

        // --- EVENTS (unchanged) ---
        widthSlider.addEventListener("input", () => {
            tbWidth = parseInt(widthSlider.value);
            widthInput.value = tbWidth;
            //this.style.setProperty("--slider-fill", `${(this.value / this.max) * 100}%`);

            applyLogoSize();
        });

        widthInput.addEventListener("input", () => {
            tbWidth = parseInt(widthInput.value);
            widthSlider.value = tbWidth;
            //widthSlider.style.setProperty("--slider-fill", `${(tbWidth / widthSlider.max) * 100}%`);

            applyLogoSize();
        });

        heightSlider.addEventListener("input", () => {
            tbHeight = parseInt(heightSlider.value);
            heightInput.value = tbHeight;
            //this.style.setProperty("--slider-fill", `${(this.value / this.max) * 100}%`);

            applyLogoSize();
        });

        heightInput.addEventListener("input", () => {
            tbHeight = parseInt(heightInput.value);
            heightSlider.value = tbHeight;
            //heightSlider.style.setProperty("--slider-fill", `${(tbHeight / heightSlider.max) * 100}%`);

            applyLogoSize();
        });


        // --- Append to your settings container ---
        wrapper.appendChild(widthWrapper);
        wrapper.appendChild(heightWrapper);


        container.appendChild(wrapper);

        setTimeout(updateSidebarLogo, 500);
    }

    function waitForSidebarMenus(callback) {
    // ✅ If menus already exist, run callback immediately — no observer needed
    if (document.querySelectorAll(".hl_nav-header a").length > 0) {
        callback();
        return;
    }
    const observer = new MutationObserver(() => {
        if (document.querySelectorAll(".hl_nav-header a").length > 0) {
            observer.disconnect();
            callback();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}
    function getGlobalPopupCustomizations() {
        try {
            return JSON.parse(localStorage.getItem("tb-popup-customizations") || "{}");
        } catch (e) {
            return {};
        }
    }

    function saveGlobalPopupCustomization(type, url, headline, subHeadline, buttonText) {
        const customizations = getGlobalPopupCustomizations();
        customizations[type] = { url, headline, subHeadline, buttonText };
        localStorage.setItem("tb-popup-customizations", JSON.stringify(customizations));
    }

    function getCustomizationForType(type) {
        const customizations = getGlobalPopupCustomizations();
        return customizations[type] || {};
    }

    function showPopupSelectionModal(menu, locationId, callback) {
        document.getElementById("tb-popup-selection-modal")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "tb-popup-selection-modal";
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.background = "rgba(0,0,0,0.5)";
        overlay.style.display = "flex";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        overlay.style.zIndex = "100000";

        const modal = document.createElement("div");
        modal.style.background = "#fff";
        modal.style.padding = "20px";
        modal.style.borderRadius = "10px";
        modal.style.maxWidth = "600px";
        modal.style.width = "90%";
        modal.style.maxHeight = "80vh";
        modal.style.overflowY = "auto";
        modal.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";

        const title = document.createElement("h3");
        title.textContent = `Select Popup for Locked Menu: ${menu.label}`;
        title.style.marginBottom = "15px";
        modal.appendChild(title);

        const content = document.createElement("div");
        modal.appendChild(content);

        let selectedType = "simple";

        // Pre-load saved values if re-editing an existing lock for this specific menu
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};
        const lockedMenus = themeData["--lockedMenus"] ? JSON.parse(themeData["--lockedMenus"]) : {};
        const existingLock = locationId ? lockedMenus[locationId]?.[menu.id] : lockedMenus[menu.id];
        if (existingLock && typeof existingLock === "object") {
            if (existingLock.popupType) selectedType = existingLock.popupType;
        }

        // Per-type customization values — loaded from global storage so customizations persist across menus
        // For each popup type, we track its own url/headline/subHeadline/buttonText independently
        const popupTypeData = {
            simple: { url: "", headline: "", subHeadline: "", buttonText: "" },
            upgrade: {},
            contact: {}
        };

        // Load globally saved customizations for upgrade and contact types
        const globalCustomizations = getGlobalPopupCustomizations();
        ["upgrade", "contact"].forEach(type => {
            const saved = globalCustomizations[type] || {};
            popupTypeData[type] = {
                url: saved.url || "",
                headline: saved.headline || "",
                subHeadline: saved.subHeadline || "",
                buttonText: saved.buttonText || ""
            };
        });

        // If there is an existing lock for this specific menu, override with the menu's saved values
        if (existingLock && typeof existingLock === "object" && existingLock.popupType) {
            const t = existingLock.popupType;
            if (t === "upgrade" || t === "contact") {
                popupTypeData[t] = {
                    url: existingLock.popupUrl || popupTypeData[t].url,
                    headline: existingLock.popupHeadline || popupTypeData[t].headline,
                    subHeadline: existingLock.popupSubHeadline || popupTypeData[t].subHeadline,
                    buttonText: existingLock.popupButtonText || popupTypeData[t].buttonText
                };
            }
        }

        const popupOptions = [
            { type: "simple", title: "Simple Access Denied", description: "Basic access denied message." },
            { type: "upgrade", title: "Upgrade Required", description: "Prompts user to upgrade their plan." },
            { type: "contact", title: "Contact Admin", description: "Asks user to contact administrator." }
        ];

        popupOptions.forEach(option => {
            const card = document.createElement("div");
            card.style.border = "2px solid #ddd";
            card.style.borderRadius = "8px";
            card.style.padding = "15px";
            card.style.marginBottom = "15px";
            card.style.cursor = "pointer";
            card.style.transition = "0.2s ease";
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.gap = "10px";

            if (option.type === selectedType) {
                card.style.borderColor = "#F54927";
                card.style.background = "#fff5f2";
            }

            const topRow = document.createElement("div");
            topRow.style.display = "flex";
            topRow.style.alignItems = "center";
            topRow.style.justifyContent = "space-between";

            const left = document.createElement("div");
            left.style.display = "flex";
            left.style.alignItems = "center";
            left.style.gap = "10px";

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "popupType";
            radio.value = option.type;
            radio.checked = option.type === selectedType;

            const cardTitle = document.createElement("strong");
            cardTitle.textContent = option.title;

            left.appendChild(radio);
            left.appendChild(cardTitle);

            const btnGroup = document.createElement("div");
            btnGroup.style.display = "flex";
            btnGroup.style.gap = "6px";

            const previewBtn = document.createElement("button");
            previewBtn.textContent = "Preview";
            previewBtn.style.padding = "5px 10px";
            previewBtn.style.border = "1px solid #ccc";
            previewBtn.style.borderRadius = "5px";
            previewBtn.style.background = "#f8f9fa";
            previewBtn.style.cursor = "pointer";
            previewBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                const d = popupTypeData[option.type];
                showPreviewPopup(option.type, d.url, d.headline, d.subHeadline, d.buttonText);
            });
            btnGroup.appendChild(previewBtn);

            // Customize button only for upgrade and contact types
            if (option.type === "upgrade" || option.type === "contact") {
                const customizeBtn = document.createElement("button");

                // Show "Customized" badge indicator if this type has saved customization
                const hasCustomization = !!(
                    popupTypeData[option.type].url ||
                    popupTypeData[option.type].headline ||
                    popupTypeData[option.type].subHeadline ||
                    popupTypeData[option.type].buttonText
                );

                customizeBtn.textContent = hasCustomization ? "Customize ✓" : "Customize";
                customizeBtn.style.padding = "5px 10px";
                customizeBtn.style.border = "1px solid #F54927";
                customizeBtn.style.borderRadius = "5px";
                customizeBtn.style.background = "#fff5f2";
                customizeBtn.style.color = "#F54927";
                customizeBtn.style.cursor = "pointer";
                if (hasCustomization) {
                    customizeBtn.style.fontWeight = "bold";
                }

                customizeBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    // Select this card first
                    selectedType = option.type;
                    document.querySelectorAll("#tb-popup-selection-modal .popup-card").forEach(c => {
                        c.style.borderColor = "#ddd";
                        c.style.background = "#fff";
                        c.querySelector("input[type='radio']").checked = false;
                    });
                    radio.checked = true;
                    card.style.borderColor = "#F54927";
                    card.style.background = "#fff5f2";

                    const d = popupTypeData[option.type];

                    // Open customize popup with the currently saved values for this type
                    showCustomizePopup(option.type, d.url, d.headline, d.subHeadline, d.buttonText, (savedUrl, savedHeadline, savedSubHeadline, savedButtonText) => {
                        // Update in-memory values for this popup type
                        popupTypeData[option.type] = {
                            url: savedUrl,
                            headline: savedHeadline,
                            subHeadline: savedSubHeadline,
                            buttonText: savedButtonText
                        };

                        // Save globally so this customization persists for future menu lock selections
                        saveGlobalPopupCustomization(option.type, savedUrl, savedHeadline, savedSubHeadline, savedButtonText);

                        // Update the Customize button label to show it's been customized
                        customizeBtn.textContent = "Customize ✓";
                        customizeBtn.style.fontWeight = "bold";
                    });
                });
                btnGroup.appendChild(customizeBtn);
            }

            topRow.appendChild(left);
            topRow.appendChild(btnGroup);

            const desc = document.createElement("p");
            desc.textContent = option.description;
            desc.style.margin = "0";
            desc.style.fontSize = "13px";
            desc.style.color = "#666";

            card.addEventListener("click", () => {
                selectedType = option.type;
                document.querySelectorAll("#tb-popup-selection-modal .popup-card").forEach(c => {
                    c.style.borderColor = "#ddd";
                    c.style.background = "#fff";
                    c.querySelector("input[type='radio']").checked = false;
                });
                radio.checked = true;
                card.style.borderColor = "#F54927";
                card.style.background = "#fff5f2";
            });

            card.classList.add("popup-card");
            card.appendChild(topRow);
            card.appendChild(desc);
            content.appendChild(card);
        });

        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.justifyContent = "flex-end";
        buttonContainer.style.gap = "10px";
        buttonContainer.style.marginTop = "20px";

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.padding = "10px 20px";
        cancelBtn.style.border = "1px solid #ccc";
        cancelBtn.style.borderRadius = "5px";
        cancelBtn.style.background = "#fff";
        cancelBtn.style.cursor = "pointer";
        cancelBtn.addEventListener("click", () => {
            overlay.remove();
            const lockInput = document.getElementById(locationId ? `lock-${locationId}-${menu.id}` : `lock-global-${menu.id}`);
            if (lockInput) lockInput.checked = false;
        });
        buttonContainer.appendChild(cancelBtn);

        const okBtn = document.createElement("button");
        okBtn.textContent = "OK";
        okBtn.style.padding = "10px 20px";
        okBtn.style.border = "none";
        okBtn.style.borderRadius = "5px";
        okBtn.style.background = "#F54927";
        okBtn.style.color = "#fff";
        okBtn.style.cursor = "pointer";
        okBtn.addEventListener("click", () => {
            overlay.remove();
            // Pass back the values for the selected popup type
            const d = popupTypeData[selectedType];
            callback(selectedType, d.url, d.headline, d.subHeadline, d.buttonText);
        });
        buttonContainer.appendChild(okBtn);

        modal.appendChild(buttonContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    function showCustomizePopup(type, currentUrl, currentHeadline, currentSubHeadline, currentButtonText, onSave) {
        document.getElementById("tb-customize-popup")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "tb-customize-popup";
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:200000;";

        const popup = document.createElement("div");
        popup.style.cssText = "background:#fff;padding:24px;border-radius:10px;max-width:420px;width:90%;box-shadow:0 8px 24px rgba(0,0,0,0.3);";

        const popupTitle = document.createElement("h3");
        popupTitle.textContent = type === "upgrade" ? "Customize Upgrade Popup" : "Customize Contact Admin Popup";
        popupTitle.style.marginBottom = "16px";
        popup.appendChild(popupTitle);

        function addField(labelText, value, placeholder) {
            const label = document.createElement("label");
            label.textContent = labelText;
            label.style.cssText = "display:block;font-size:13px;font-weight:bold;margin-bottom:5px;";
            popup.appendChild(label);
            const input = document.createElement("input");
            input.type = "text";
            input.value = value || "";
            input.placeholder = placeholder;
            input.style.cssText = "width:100%;padding:8px;border:1px solid #ccc;border-radius:5px;font-size:13px;box-sizing:border-box;margin-bottom:14px;";
            popup.appendChild(input);
            return input;
        }

        const headlineInput    = addField("Headline Text:", currentHeadline, type === "upgrade" ? "Upgrade Required 🚀" : "Restricted");
        const subHeadlineInput = addField("Sub-Headline Text:", currentSubHeadline, type === "upgrade" ? "This feature is available in Premium Plan." : "Please contact admin to get access.");
        const buttonTextInput  = addField("Button Text:", currentButtonText, type === "upgrade" ? "Upgrade" : "Contact");
        const urlInput         = addField(type === "upgrade" ? "Upgrade Button URL:" : "Contact Button URL:", currentUrl, "https://your-url.com");

        const btnRow = document.createElement("div");
        btnRow.style.cssText = "display:flex;gap:10px;justify-content:flex-end;margin-top:6px;";

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.cssText = "padding:8px 18px;border:1px solid #ccc;border-radius:5px;background:#fff;cursor:pointer;";
        cancelBtn.onclick = () => overlay.remove();

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.style.cssText = "padding:8px 18px;border:none;border-radius:5px;background:#F54927;color:#fff;cursor:pointer;";
        saveBtn.onclick = () => {
            onSave(urlInput.value.trim(), headlineInput.value.trim(), subHeadlineInput.value.trim(), buttonTextInput.value.trim());
            overlay.remove();
        };

        btnRow.appendChild(cancelBtn);
        btnRow.appendChild(saveBtn);
        popup.appendChild(btnRow);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }

    function buildFeatureLockSection(container) {
        const email = localStorage.getItem("g-em") ? atob(localStorage.getItem("g-em")) : null;
        let savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        if (savedTheme.themeData && typeof savedTheme.themeData === "string") {
            savedTheme.themeData = JSON.parse(savedTheme.themeData);
            saveUserTheme(savedTheme);
        }

        if (document.getElementById("tb-feature-lock-settings")) return;

        const wrapper = document.createElement("div");
        wrapper.id = "tb-feature-lock-settings";
        wrapper.className = "tb-feature-lock-settings";

        const themeData = savedTheme.themeData || {};

        const agencyMenus = [
            { id: "sb_agency-dashboard", label: "Agency Dashboard" },
            { id: "sb_location-prospect", label: "Prospecting" },
            { id: "sb_agency-accounts", label: "Agency Accounts" },
            { id: "sb_agency-account-reselling", label: "Account Reselling" },
            { id: "sb_agency-marketplace", label: "Add-Ons" },
            { id: "sb_agency-affiliate-portal", label: "Affiliate Portal" },
            { id: "sb_agency-template-library", label: "Template Library" },
            { id: "sb_agency-partners", label: "Partners" },
            { id: "sb_agency-university", label: "University" },
            { id: "sb_saas-education", label: "SaaS Education" },
            { id: "sb_ghl-swag", label: "GHL Swag" },
            { id: "sb_agency-ideas", label: "Agency Ideas" },
            { id: "sb_mobile-app-customiser", label: "Mobile App Customiser" },
            { id: "sb_agency-account-snapshots", label: "Account Snapshots" },
        ];

        const sidebarMenus = [
            { id: "sb_launchpad", label: "Launchpad" },
            { id: "sb_dashboard", label: "Dashboard" },
            { id: "sb_conversations", label: "Conversations" },
            { id: "sb_opportunities", label: "Opportunities" },
            { id: "sb_calendars", label: "Calendars" },
            { id: "sb_contacts", label: "Contacts" },
            { id: "sb_payments", label: "Payments" },
            { id: "sb_vibe", label: "AI Studio" },
            { id: "sb_reporting", label: "Reporting" },
            { id: "sb_email-marketing", label: "Email Marketing" },
            { id: "sb_automation", label: "Automation" },
            { id: "sb_sites", label: "Sites" },
            { id: "sb_app-media", label: "App Media" },
            { id: "sb_memberships", label: "Memberships" },
            { id: "sb_reputation", label: "Reputation" },
        ];

        // 📝 Instruction Paragraph for Lock & Hide Feature
        const lockHideInfo = document.createElement("p");
        lockHideInfo.className = "tb-instruction-text";
        lockHideInfo.style.marginBottom = "15px";
        lockHideInfo.style.lineHeight = "1.6";
        lockHideInfo.innerHTML = `
            🔒 <strong>How the Location-Based Lock & Hide Feature Works:</strong><br><br>
            1. Use the <strong>Configure Lock</strong> button to set which menus are locked for specific locations/subaccounts.<br>
            2. Use the <strong>Configure Hide</strong> button to set which menus are hidden for specific locations/subaccounts.<br>
            3. Enter the Location/Subaccount ID in the input field within the configuration modal.<br>
            4. Toggle the options for each menu item to apply per location.<br><br>
            ✨ <em>Note:</em> Settings are stored per location, allowing granular control over menu access and visibility.
            `;
        wrapper.appendChild(lockHideInfo);

        // Buttons
        const buttonContainer = document.createElement("div");
        buttonContainer.style.display = "flex";
        buttonContainer.style.gap = "10px";
        buttonContainer.style.marginBottom = "20px";

        const configureBtn = document.createElement("button");
        configureBtn.textContent = "Configure Lock & Hide";
        configureBtn.style.padding = "10px 20px";
        configureBtn.style.border = "none";
        configureBtn.style.borderRadius = "5px";
        configureBtn.style.background = "#b2857e";
        configureBtn.style.color = "#fff";
        configureBtn.style.cursor = "pointer";
        configureBtn.addEventListener("click", () => openConfigureModal(agencyMenus, sidebarMenus));

        buttonContainer.appendChild(configureBtn);
        wrapper.appendChild(buttonContainer);

        container.appendChild(wrapper);

        // Function to open configure modal
        function openConfigureModal(agencyMenus, sidebarMenus) {
            document.getElementById("tb-configure-modal")?.remove();

            const overlay = document.createElement("div");
            overlay.id = "tb-configure-modal";
            overlay.style.position = "fixed";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.background = "rgba(0,0,0,0.5)";
            overlay.style.display = "flex";
            overlay.style.alignItems = "center";
            overlay.style.justifyContent = "center";
            overlay.style.zIndex = "99999";

            const modal = document.createElement("div");
            modal.style.background = "#fff";
            modal.style.padding = "20px";
            modal.style.borderRadius = "10px";
            modal.style.maxWidth = "800px";
            modal.style.width = "90%";
            modal.style.maxHeight = "80vh";
            modal.style.overflowY = "auto";
            modal.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
            modal.style.position = "relative";

            modal.addEventListener("click", (e) => e.stopPropagation());

            const topBar = document.createElement("div");
            topBar.style.position = "sticky";
            topBar.style.top = "-20px";
            topBar.style.display = "flex";
            topBar.style.justifyContent = "space-between";
            topBar.style.alignItems = "center";
            topBar.style.background = "#fff";
            topBar.style.zIndex = "10";
            topBar.style.paddingBottom = "10px";
            topBar.style.borderBottom = "1px solid #eee";
            topBar.style.padding = "10px 0";

            const title = document.createElement("h3");
            title.textContent = "Configure Lock & Hide Settings";
            title.style.margin = "0";

            const closeBtn = document.createElement("button");
            closeBtn.textContent = "✕";
            closeBtn.style.background = "transparent";
            closeBtn.style.border = "none";
            closeBtn.style.fontSize = "20px";
            closeBtn.style.cursor = "pointer";
            closeBtn.style.color = "#6c757d";

            closeBtn.addEventListener("click", () => overlay.remove());

            topBar.appendChild(title);
            topBar.appendChild(closeBtn);

            modal.appendChild(topBar);

            const content = document.createElement("div");
            modal.appendChild(content);

            loadAllToggles(content, agencyMenus, sidebarMenus);

            overlay.appendChild(modal);
            document.body.appendChild(overlay);
        }

        // Function to load all toggles
        function loadAllToggles(content, agencyMenus, sidebarMenus) {
            content.innerHTML = "";
            const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
            const themeData = savedTheme.themeData || {};
            const agencyData = themeData["--agencyLockedHideMenus"] ? JSON.parse(themeData["--agencyLockedHideMenus"]) : {};
            const lockedMenus = themeData["--lockedMenus"] ? JSON.parse(themeData["--lockedMenus"]) : {};
            const hiddenMenus = themeData["--hiddenMenus"] ? JSON.parse(themeData["--hiddenMenus"]) : {};

            // Agency Level (Global)
            const agencyTitle = document.createElement("h4");
            agencyTitle.textContent = "Agency Level Settings";
            agencyTitle.style.marginTop = "20px";
            agencyTitle.style.marginBottom = "10px";
            content.appendChild(agencyTitle);

            const agencyHeader = document.createElement("div");
            agencyHeader.style.display = "flex";
            agencyHeader.style.justifyContent = "space-between";
            agencyHeader.style.fontWeight = "bold";
            agencyHeader.style.marginBottom = "10px";
            agencyHeader.style.borderBottom = "1px solid #ccc";
            agencyHeader.style.paddingBottom = "5px";

            const menuHeader = document.createElement("span");
            menuHeader.textContent = "Menu";
            menuHeader.style.flex = "1";

            const hideHeader = document.createElement("span");
            hideHeader.textContent = "Hide";
            hideHeader.style.width = "60px";
            hideHeader.style.textAlign = "center";

            agencyHeader.appendChild(menuHeader);
            agencyHeader.appendChild(hideHeader);
            content.appendChild(agencyHeader);

            agencyMenus.forEach(menu => {
                createToggleRow(menu, null, lockedMenus, hiddenMenus, content, agencyData);
            });

            // ─── Sub-Account Level ───────────────────────────────────────────────────

            const subTitle = document.createElement("h4");
            subTitle.textContent = "Sub-Account Level";
            subTitle.style.marginTop = "30px";
            subTitle.style.marginBottom = "10px";
            content.appendChild(subTitle);

            // Description shown when table is hidden
            const subDescription = document.createElement("p");
            subDescription.style.fontSize = "13px";
            subDescription.style.color = "#555";
            subDescription.style.lineHeight = "1.6";
            subDescription.style.marginBottom = "12px";
            subDescription.innerHTML = `🔒 Use the <strong>+ Add Subaccount</strong> button below to create a new sub-account configuration.<br><br>

    Once added, enter the <strong>Location ID</strong> for that sub-account and click the <strong>Update</strong> button to activate it.<br><br>

    After updating, you can use the menu toggles to control which items are <i class="fa-solid fa-lock"></i> <strong>Locked</strong> or <i class="fa-solid fa-eye-slash"></i> <strong>Hidden</strong> for that specific location.<br><br>

    Finally, don't forget to click the <strong>Apply Changes</strong> button to save and apply your settings.`;
            content.appendChild(subDescription);

            // Collect all configured location IDs
            const allLocations = new Set();
            Object.keys(lockedMenus).forEach(key => {
                if (typeof lockedMenus[key] === 'object') allLocations.add(key);
            });
            Object.keys(hiddenMenus).forEach(key => {
                if (typeof hiddenMenus[key] === 'object') allLocations.add(key);
            });
            const locationList = Array.from(allLocations);

            // Table wrapper (hidden when no rows exist)
            const tableWrapper = document.createElement("div");
            tableWrapper.style.overflowX = "auto";
            tableWrapper.style.marginBottom = "20px";
            tableWrapper.style.display = locationList.length === 0 ? "none" : "block";
            content.appendChild(tableWrapper);

            // Create combined table
            const table = document.createElement("table");
            table.style.width = "auto";
            table.style.borderCollapse = "collapse";
            table.style.marginBottom = "20px";
            table.style.fontSize = "12px";
            table.style.tableLayout = "fixed";

            const thead = document.createElement("thead");
            const headerRow = document.createElement("tr");

            const menuTh = document.createElement("th");
            menuTh.textContent = "Location ID";
            menuTh.style.border = "1px solid #ddd";
            menuTh.style.padding = "4px";
            menuTh.style.background = "#f2f2f2";
            menuTh.style.fontSize = "10px";
            menuTh.style.width = "167px";
            headerRow.appendChild(menuTh);

            sidebarMenus.forEach(menu => {
                const th = document.createElement("th");
                th.textContent = menu.label;
                th.style.border = "1px solid #ddd";
                th.style.padding = "4px";
                th.style.background = "#f2f2f2";
                th.style.textAlign = "center";
                th.style.fontSize = "10px";
                th.style.width = "80px";
                headerRow.appendChild(th);
            });

            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = document.createElement("tbody");

            // Render existing rows
            locationList.forEach(locationId => {
                addRowToTbody(tbody, locationId, lockedMenus, hiddenMenus);
            });

            table.appendChild(tbody);
            tableWrapper.appendChild(table);

            // ─── Add Subaccount Button ────────────────────────────────────────────────
            const addBtn = document.createElement("button");
            addBtn.textContent = "+ Add Subaccount";
            addBtn.style.border = "none";
            addBtn.style.background = "#28a745";
            addBtn.style.color = "#fff";
            addBtn.style.padding = "8px 16px";
            addBtn.style.borderRadius = "3px";
            addBtn.style.cursor = "pointer";
            addBtn.style.marginTop = "10px";
            addBtn.addEventListener("click", () => {
                // Show the table if it was hidden
                tableWrapper.style.display = "block";

                // Generate a placeholder ID (not saved yet)
                const placeholderId = "new_location_" + Date.now();

                // Save an empty entry so toggles have a key to work with
                const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                saved.themeData = saved.themeData || {};
                let locked = saved.themeData["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
                let hidden = saved.themeData["--hiddenMenus"] ? JSON.parse(saved.themeData["--hiddenMenus"]) : {};
                locked[placeholderId] = {};
                hidden[placeholderId] = {};
                saved.themeData["--lockedMenus"] = JSON.stringify(locked);
                saved.themeData["--hiddenMenus"] = JSON.stringify(hidden);
                saveUserTheme(saved);

                // Add row directly without full reload — input shows placeholder, value is empty
                addRowToTbody(tbody, placeholderId, locked, hidden, true);
            });
            content.appendChild(addBtn);

            const saveChangesBtn = document.createElement("button");
            saveChangesBtn.textContent = "Save Changes";
            saveChangesBtn.style.border = "none";
            saveChangesBtn.style.background = "#007bff";
            saveChangesBtn.style.color = "#fff";
            saveChangesBtn.style.padding = "8px 16px";
            saveChangesBtn.style.borderRadius = "3px";
            saveChangesBtn.style.cursor = "pointer";
            saveChangesBtn.style.marginTop = "10px";
            saveChangesBtn.style.marginLeft = "10px";
            saveChangesBtn.style.display = "none";

            const saveMsg = document.createElement("span");
            saveMsg.style.fontSize = "12px";
            saveMsg.style.color = "#28a745";
            saveMsg.style.marginLeft = "8px";
            saveMsg.style.verticalAlign = "middle";
            saveMsg.style.display = "none";
            saveMsg.innerHTML = '<i class="fa-solid fa-circle-check"></i> Changes saved! Don\'t forget to Apply Changes.';

            saveChangesBtn.addEventListener("click", () => {
                saveChangesBtn.style.display = "none";
                saveMsg.style.display = "inline";
                setTimeout(() => {
                    saveMsg.style.display = "none";
                }, 12000);
            });

            content.appendChild(saveChangesBtn);
            content.appendChild(saveMsg);

            function markChanged() {
                saveChangesBtn.style.display = "inline-block";
                saveMsg.style.display = "none";
            }

            // ─── Helper: add a single row ─────────────────────────────────────────────
            function addRowToTbody(tbody, locationId, lockedMenus, hiddenMenus, isNew) {
                const row = document.createElement("tr");

                // Location ID cell
                const toggleInputsInRow = [];
                let isUpdated = !isNew;

                const idCell = document.createElement("td");
                idCell.style.border = "1px solid #ddd";
                idCell.style.padding = "4px";
                idCell.style.width = "167px";

                const idInput = document.createElement("input");
                idInput.type = "text";
                idInput.style.width = "100px";
                idInput.style.border = "none";
                idInput.style.background = "transparent";
                idInput.style.fontSize = "10px";

                if (isNew) {
                    // New row: input is empty, placeholder shows the generated key
                    idInput.value = "";
                    idInput.placeholder = "Enter Location ID";
                } else {
                    // Existing row: show the saved ID as the value
                    idInput.value = locationId;
                    idInput.placeholder = "Location ID";
                }

                idCell.appendChild(idInput);

                const updateBtn = document.createElement("button");
                updateBtn.textContent = "Update";
                updateBtn.style.fontSize = "10px";
                updateBtn.style.padding = "4px 8px";
                updateBtn.style.border = "1px solid #ccc";
                updateBtn.style.background = "#f0f0f0";
                updateBtn.style.cursor = "pointer";
                updateBtn.style.marginRight = "4px";
                const tickIcon = document.createElement("span");
                tickIcon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
                tickIcon.style.fontSize = "14px";
                tickIcon.style.verticalAlign = "middle";
                if (isNew) {
                    tickIcon.style.color = "#999";
                } else {
                    tickIcon.style.color = "#28a745";
                }
                function setTogglesDisabled(disabled) {
                    toggleInputsInRow.forEach(inp => {
                        inp.disabled = disabled;
                        const parentSwitch = inp.closest('.toggle-switch');
                        if (parentSwitch) {
                            parentSwitch.style.opacity = disabled ? "0.4" : "1";
                            parentSwitch.style.pointerEvents = disabled ? "none" : "auto";
                        }
                    });
                }
                idInput.addEventListener("input", () => {
                    if (isUpdated) {
                        isUpdated = false;
                        tickIcon.style.color = "#999";
                        setTogglesDisabled(true);
                    }
                });
                updateBtn.addEventListener("click", () => {
                    const newId = idInput.value.trim();
                    if (!newId) {
                        tickIcon.style.color = "#dc3545";
                        setTogglesDisabled(true);
                        return;
                    }
                    tickIcon.style.color = "#28a745";
                    isUpdated = true;
                    setTogglesDisabled(false);
                    updateLocationId(locationId, newId);
                    // After update, update the tracked locationId for future clicks
                    locationId = newId;
                    markChanged();
                });
                idCell.appendChild(updateBtn);
                idCell.appendChild(tickIcon);

                row.appendChild(idCell);

                // Menu toggle cells
                sidebarMenus.forEach(menu => {
                    const cell = document.createElement("td");
                    cell.style.border = "1px solid #ddd";
                    cell.style.padding = "4px";
                    cell.style.textAlign = "center";

                    const locationLocked = lockedMenus[locationId] || {};
                    const locationHidden = hiddenMenus[locationId] || {};

                    // Lock toggle
                    const lockDiv = document.createElement("div");
                    lockDiv.style.display = "flex";
                    lockDiv.style.alignItems = "center";
                    lockDiv.style.justifyContent = "center";
                    lockDiv.style.marginBottom = "2px";

                    const lockLabel = document.createElement("span");

                    lockLabel.innerHTML = '<i class="fas fa-lock"></i>';
                    lockLabel.style.fontSize = "10px";
                    lockLabel.style.marginRight = "2px";
                    lockDiv.appendChild(lockLabel);

                    const lockSwitch = document.createElement("div");
                    lockSwitch.className = "toggle-switch";
                    lockSwitch.style.transform = "scale(0.7)";

                    const lockInput = document.createElement("input");
                    lockInput.type = "checkbox";
                    lockInput.className = "toggle-input";
                    lockInput.id = `lock-${locationId}-${menu.id}`;
                    lockInput.checked = !!locationLocked[menu.id];
                    if (isNew) {
                        lockInput.disabled = true;
                    }
                    toggleInputsInRow.push(lockInput);

                    lockLabel.innerHTML = lockInput.checked
                        ? '<i class="fas fa-lock"></i>'
                        : '<i class="fas fa-lock-open"></i>';

                    lockLabel.style.fontSize = "10px";
                    lockLabel.style.marginRight = "2px";

                    const lockToggleLabel = document.createElement("label");
                    lockToggleLabel.className = "toggle-label";
                    lockToggleLabel.setAttribute("for", lockInput.id);

                    lockSwitch.appendChild(lockInput);
                    lockSwitch.appendChild(lockToggleLabel);
                    lockDiv.appendChild(lockSwitch);
                    cell.appendChild(lockDiv);

                    // Hide toggle
                    const hideDiv = document.createElement("div");
                    hideDiv.style.display = "flex";
                    hideDiv.style.alignItems = "center";
                    hideDiv.style.justifyContent = "center";

                    const hideLabelSpan = document.createElement("span");

                    hideLabelSpan.innerHTML = '<i class="fa-solid fa-eye"></i>';
                    hideLabelSpan.style.fontSize = "12px";
                    hideLabelSpan.style.marginRight = "2px";
                    hideDiv.appendChild(hideLabelSpan);

                    const hideSwitch = document.createElement("div");
                    hideSwitch.className = "toggle-switch";
                    hideSwitch.style.transform = "scale(0.7)";

                    const hideInput = document.createElement("input");
                    hideInput.type = "checkbox";
                    hideInput.className = "toggle-input";
                    hideInput.id = `hide-${locationId}-${menu.id}`;
                    hideInput.checked = locationHidden[menu.id] ? !!locationHidden[menu.id].toggleChecked : false;

                    if (isNew) {
                        hideInput.disabled = true;
                    }
                    toggleInputsInRow.push(hideInput);
                    hideLabelSpan.innerHTML = hideInput.checked
                        ? '<i class="fa-solid fa-eye"></i>'
                        : '<i class="fa-solid fa-eye-slash"></i>';

                    hideLabelSpan.style.fontSize = "10px";
                    hideLabelSpan.style.marginRight = "2px";

                    const hideToggleLabel = document.createElement("label");
                    hideToggleLabel.className = "toggle-label";
                    hideToggleLabel.setAttribute("for", hideInput.id);

                    hideSwitch.appendChild(hideInput);
                    hideSwitch.appendChild(hideToggleLabel);
                    hideDiv.appendChild(hideSwitch);
                    cell.appendChild(hideDiv);

                    // Lock event
                    lockInput.addEventListener("change", () => {
                        const currentId = idInput.value.trim() || locationId;
                        if (lockInput.checked) {
                            showPopupSelectionModal(menu, currentId, (selectedType, selectedUrl, selectedHeadline, selectedSubHeadline, selectedButtonText) => {
                                const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                                saved.themeData = saved.themeData || {};
                                let locked = saved.themeData["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
                                if (!locked[currentId]) locked[currentId] = {};
                                locked[currentId][menu.id] = { locked: true, popupType: selectedType, popupUrl: selectedUrl, popupHeadline: selectedHeadline, popupSubHeadline: selectedSubHeadline, popupButtonText: selectedButtonText };
                                saved.themeData["--lockedMenus"] = JSON.stringify(locked);
                                saveUserTheme(saved);
                                applyLockedMenus();
                                markChanged();
                            });
                        } else {
                            const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                            saved.themeData = saved.themeData || {};
                            let locked = saved.themeData["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
                            const currentId = idInput.value.trim() || locationId;
                            if (locked[currentId]) delete locked[currentId][menu.id];
                            saved.themeData["--lockedMenus"] = JSON.stringify(locked);
                            saveUserTheme(saved);
                            applyLockedMenus();
                            markChanged();
                        }
                    });

                    // Hide event
                    hideInput.addEventListener("change", () => {
                        const currentId = idInput.value.trim() || locationId;
                        const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                        saved.themeData = saved.themeData || {};
                        let hidden = saved.themeData["--hiddenMenus"] ? JSON.parse(saved.themeData["--hiddenMenus"]) : {};
                        if (!hidden[currentId]) hidden[currentId] = {};
                        hidden[currentId][menu.id] = {
                            hidden: hideInput.checked,
                            display: hideInput.checked ? "none !important" : "flex !important",
                            toggleChecked: hideInput.checked
                        };
                        saved.themeData["--hiddenMenus"] = JSON.stringify(hidden);
                        saveUserTheme(saved);
                        applyHiddenMenus();
                        markChanged();
                    });

                    row.appendChild(cell);
                });

                tbody.appendChild(row);
            }

            function updateLocationId(oldId, newId) {
                if (oldId === newId) return;
                const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                saved.themeData = saved.themeData || {};
                let locked = saved.themeData["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
                let hidden = saved.themeData["--hiddenMenus"] ? JSON.parse(saved.themeData["--hiddenMenus"]) : {};
                if (locked[oldId]) {
                    locked[newId] = locked[oldId];
                    delete locked[oldId];
                }
                if (hidden[oldId]) {
                    hidden[newId] = hidden[oldId];
                    delete hidden[oldId];
                }
                saved.themeData["--lockedMenus"] = JSON.stringify(locked);
                saved.themeData["--hiddenMenus"] = JSON.stringify(hidden);
                saveUserTheme(saved);
                loadAllToggles(content, agencyMenus, sidebarMenus);
            }
        }

        // Function to create toggle row (Agency Level)
        function createToggleRow(menu, locationId, lockedMenus, hiddenMenus, parent, agencyData = {}) {
            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.alignItems = "center";
            row.style.justifyContent = "space-between";
            row.style.marginBottom = "10px";
            row.style.padding = "5px 0";
            row.style.borderBottom = "1px solid #eee";

            const label = document.createElement("span");
            label.textContent = menu.label;
            label.style.flex = "1";
            label.style.fontSize = "14px";

            const toggleWrapper = document.createElement("div");
            toggleWrapper.style.display = "flex";
            toggleWrapper.style.gap = "20px";
            toggleWrapper.style.alignItems = "center";

            // Hide toggle
            const hideWrapper = document.createElement("div");
            hideWrapper.style.display = "flex";
            hideWrapper.style.alignItems = "center";
            hideWrapper.style.justifyContent = "center";
            hideWrapper.style.width = "60px";

            const hideSwitch = document.createElement("div");
            hideSwitch.className = "toggle-switch";

            const hideInput = document.createElement("input");
            hideInput.type = "checkbox";
            hideInput.className = "toggle-input";
            hideInput.id = locationId ? `hide-${locationId}-${menu.id}` : `hide-global-${menu.id}`;
            hideInput.checked = locationId
                ? (hiddenMenus[locationId]?.[menu.id] ? !!hiddenMenus[locationId][menu.id].toggleChecked : false)
                : (agencyData.hidden?.[menu.id] ? !!agencyData.hidden[menu.id].toggleChecked : false);

            const hideLabel = document.createElement("label");
            hideLabel.className = "toggle-label";
            hideLabel.setAttribute("for", hideInput.id);

            hideSwitch.appendChild(hideInput);
            hideSwitch.appendChild(hideLabel);
            hideWrapper.appendChild(hideSwitch);
            toggleWrapper.appendChild(hideWrapper);

            hideInput.addEventListener("change", () => {
                const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                saved.themeData = saved.themeData || {};
                let hidden = saved.themeData["--hiddenMenus"] ? JSON.parse(saved.themeData["--hiddenMenus"]) : {};
                if (locationId) {
                    if (!hidden[locationId]) hidden[locationId] = {};
                    hidden[locationId][menu.id] = {
                        hidden: hideInput.checked,
                        display: hideInput.checked ? "none !important" : "flex !important",
                        toggleChecked: hideInput.checked
                    };
                } else {
                    let agencyData = saved.themeData["--agencyLockedHideMenus"] ? JSON.parse(saved.themeData["--agencyLockedHideMenus"]) : {};
                    agencyData.hidden = agencyData.hidden || {};
                    agencyData.hidden[menu.id] = {
                        hidden: hideInput.checked,
                        display: hideInput.checked ? "none !important" : "flex !important",
                        toggleChecked: hideInput.checked
                    };
                    saved.themeData["--agencyLockedHideMenus"] = JSON.stringify(agencyData);
                }
                saved.themeData["--hiddenMenus"] = JSON.stringify(hidden);
                saveUserTheme(saved);
                applyHiddenMenus();
                markChanged();
            });

            row.appendChild(label);
            row.appendChild(toggleWrapper);
            parent.appendChild(row);
        }
    }
    function buildIndividualAccountThemesSection(container) {
    const email = localStorage.getItem("g-em") ? atob(localStorage.getItem("g-em")) : null;

    if (document.getElementById("tb-individual-account-themes")) return;

    const wrapper = document.createElement("div");
    wrapper.id = "tb-individual-account-themes";

    const instruction = document.createElement("p");
    instruction.className = "tb-instruction-text";
    instruction.style.cssText = "margin-bottom:16px;line-height:1.7;";
    instruction.innerHTML = `
        🎨 <strong>How to Use Individual Account Themes:</strong><br><br>
        1. Click <strong>Subaccount Theme Settings</strong> to open the configuration panel.<br>
        2. Click <strong>+ Add Subaccount</strong> to add a new subaccount entry.<br>
        3. Enter the <strong>Location ID</strong>, an optional <strong>Logo URL</strong>, and choose a <strong>Theme</strong>.<br>
        4. Click <strong>Save</strong> on each row, then <strong>Apply Changes</strong> to finalize the Subaccount Theme Implementation.<br><br>
        ✨ <em>Each subaccount can have its own unique logo and theme.</em>
    `;
    wrapper.appendChild(instruction);

        const subaccountThemeBtn = document.createElement("button");
        subaccountThemeBtn.textContent = "Subaccount Theme Settings";
        subaccountThemeBtn.style.cssText = "padding:10px 20px;border:none;border-radius:5px;background:#b2857e;color:#fff;cursor:pointer;";
        subaccountThemeBtn.addEventListener("click", () => openSubaccountThemeModal());
        wrapper.appendChild(subaccountThemeBtn);


    container.appendChild(wrapper);

    function openSubaccountThemeModal() {
        document.getElementById("tb-subaccount-theme-modal")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "tb-subaccount-theme-modal";
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:99999;";

        const modal = document.createElement("div");
        modal.style.cssText = "background:#fff;padding:24px;border-radius:10px;max-width:860px;width:96%;max-height:88vh;overflow-y:auto;box-shadow:0 8px 24px rgba(0,0,0,0.3);position:relative;color:#333;";
        modal.addEventListener("click", e => e.stopPropagation());

        // ── Sticky top bar ──
        const topBar = document.createElement("div");
        topBar.style.cssText = "position:sticky;top:-24px;display:flex;justify-content:space-between;align-items:center;background:#fff;z-index:10;padding:10px 0 14px;border-bottom:1px solid #eee;margin-bottom:18px;";

        const titleWrap = document.createElement("div");
        titleWrap.innerHTML = `
            <h3 style="margin:0;font-size:16px;color:#333;font-weight:700;letter-spacing:.3px;">Subaccount Theme Settings</h3>
            <p style="margin:4px 0 0;font-size:12px;color:#666;">Assign a custom logo and theme to each subaccount location. And don't forget to save your changes!</p>
        `;

        const closeBtn = document.createElement("button");
        closeBtn.textContent = "✕";
        closeBtn.style.cssText = "background:transparent;border:none;font-size:20px;cursor:pointer;color:#6c757d;flex-shrink:0;transition:color .2s;";
        closeBtn.onmouseenter = () => closeBtn.style.color = "#333";
        closeBtn.onmouseleave = () => closeBtn.style.color = "#6c757d";
        closeBtn.addEventListener("click", () => overlay.remove());

        topBar.appendChild(titleWrap);
        topBar.appendChild(closeBtn);
        modal.appendChild(topBar);

        const contentArea = document.createElement("div");
        modal.appendChild(contentArea);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        renderSubaccountThemeContent(contentArea);
    }

    function renderSubaccountThemeContent(contentArea) {
        contentArea.innerHTML = "";

        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};
        let subaccountThemes = {};
        try { subaccountThemes = themeData["--subaccountThemes"] ? JSON.parse(themeData["--subaccountThemes"]) : {}; } catch (e) {}

        const locationIds = Object.keys(subaccountThemes);

        // ── Column header bar ──
        const colHeader = document.createElement("div");
        colHeader.style.cssText = "display:grid;grid-template-columns:1fr 1fr 1fr 90px 40px;gap:10px;padding:0 10px 8px;border-bottom:1px solid #ddd;margin-bottom:10px;";
        colHeader.innerHTML = `
            <span style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.8px;">Location ID</span>
            <span style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.8px;">Logo URL</span>
            <span style="font-size:11px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.8px;">Theme</span>
            <span></span>
            <span></span>
        `;
        contentArea.appendChild(colHeader);

        const rowsWrapper = document.createElement("div");
        rowsWrapper.id = "tb-subaccount-rows";
        contentArea.appendChild(rowsWrapper);

        if (locationIds.length === 0) {
            const emptyMsg = document.createElement("p");
            emptyMsg.id = "tb-subaccount-empty";
            emptyMsg.style.cssText = "color:#888;font-size:13px;text-align:center;padding:24px 0;";
            emptyMsg.textContent = "No subaccounts configured yet. Click '+ Add Subaccount' below to get started.";
            rowsWrapper.appendChild(emptyMsg);
        } else {
            locationIds.forEach(locId => {
                addSubaccountThemeRow(rowsWrapper, locId, subaccountThemes[locId], false);
            });
        }

        // ── Add Subaccount button (bottom) ──
        const addRowBtn = document.createElement("button");
        addRowBtn.innerHTML = `<span style="font-size:16px;line-height:1;margin-right:6px;">+</span> Add Subaccount`;
        addRowBtn.style.cssText = `
            display:flex;align-items:center;justify-content:center;
            width:100%;margin-top:16px;padding:11px;
            border:2px dashed #ccc;border-radius:8px;
            background:transparent;color:#28a745;
            font-size:13px;font-weight:600;cursor:pointer;
            transition:all .2s;
        `;
        addRowBtn.onmouseenter = () => {
            addRowBtn.style.background = "rgba(40,167,69,.06)";
            addRowBtn.style.borderColor = "#28a745";
        };
        addRowBtn.onmouseleave = () => {
            addRowBtn.style.background = "transparent";
            addRowBtn.style.borderColor = "#ccc";
        };
        addRowBtn.addEventListener("click", () => {
            document.getElementById("tb-subaccount-empty")?.remove();
            addSubaccountThemeRow(rowsWrapper, "", null, true);
            rowsWrapper.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
        });
        contentArea.appendChild(addRowBtn);
    }

    function addSubaccountThemeRow(rowsWrapper, locationId, existingData, isNew) {
        const themes = {};

        const row = document.createElement("div");
        row.style.cssText = `
            display:grid;grid-template-columns:1fr 1fr 1fr 90px 40px;
            gap:10px;align-items:center;
            padding:10px;border-radius:8px;
            background:#fafafa;border:1px solid #ddd;
            margin-bottom:8px;transition:border-color .2s;
        `;
        row.onmouseenter = () => row.style.borderColor = "#b2857e";
        row.onmouseleave = () => row.style.borderColor = "#ddd";

        // ── 1: Location ID ──
        const locIdInput = document.createElement("input");
        locIdInput.type = "text";
        locIdInput.value = isNew ? "" : locationId;
        locIdInput.placeholder = "Location ID";
        locIdInput.style.cssText = `
            width:100%;padding:7px 10px;box-sizing:border-box;
            border:1px solid #ccc;border-radius:5px;
            background:#fff;color:#333;font-size:13px;
            outline:none;transition:border-color .2s;
        `;
        locIdInput.onfocus = () => locIdInput.style.borderColor = "#b2857e";
        locIdInput.onblur  = () => locIdInput.style.borderColor = "#ccc";

        // ── 2: Logo URL ──
        const logoUrlInput = document.createElement("input");
        logoUrlInput.type = "text";
        logoUrlInput.value = existingData?.logoUrl || "";
        logoUrlInput.placeholder = "https://logo-url.com/logo.png";
        logoUrlInput.style.cssText = `
            width:100%;padding:7px 10px;box-sizing:border-box;
            border:1px solid #ccc;border-radius:5px;
            background:#fff;color:#333;font-size:13px;
            outline:none;transition:border-color .2s;
        `;
        logoUrlInput.onfocus = () => logoUrlInput.style.borderColor = "#b2857e";
        logoUrlInput.onblur  = () => logoUrlInput.style.borderColor = "#ccc";

        // ── 3: Theme dropdown ──
        const themeSelect = document.createElement("select");
        themeSelect.style.cssText = `
            width:100%;padding:7px 10px;box-sizing:border-box;
            border:1px solid #ccc;border-radius:5px;
            background:#fff;color:#333;font-size:13px;
            cursor:pointer;outline:none;transition:border-color .2s;
        `;
        themeSelect.onfocus = () => themeSelect.style.borderColor = "#b2857e";
        themeSelect.onblur  = () => themeSelect.style.borderColor = "#ccc";

        const loadingOpt = document.createElement("option");
        loadingOpt.value = "";
        loadingOpt.textContent = "⏳ Loading...";
        loadingOpt.disabled = true;
        loadingOpt.selected = true;
        themeSelect.appendChild(loadingOpt);

        // ── 4: Save button ──
        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.style.cssText = `
            padding:7px 12px;border:none;border-radius:5px;
            background:#007bff;color:#fff;font-size:12px;
            font-weight:700;cursor:pointer;white-space:nowrap;
            transition:background .2s;width:100%;
        `;
        saveBtn.onmouseenter = () => saveBtn.style.background = "#0062cc";
        saveBtn.onmouseleave = () => saveBtn.style.background = "#007bff";

        saveBtn.addEventListener("click", () => {
            const locId = locIdInput.value.trim();
            if (!locId) {
                locIdInput.style.borderColor = "#dc3545";
                locIdInput.placeholder = "⚠ Required!";
                locIdInput.focus();
                setTimeout(() => {
                    locIdInput.style.borderColor = "#ccc";
                    locIdInput.placeholder = "Location ID";
                }, 2000);
                return;
            }

            const selectedThemeName = themeSelect.value;
            const logoUrl = logoUrlInput.value.trim();

            const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
            saved.themeData = saved.themeData || {};
            let sub = {};
            try { sub = saved.themeData["--subaccountThemes"] ? JSON.parse(saved.themeData["--subaccountThemes"]) : {}; } catch(e) {}

            if (locationId && locationId !== locId) delete sub[locationId];
            sub[locId] = { logoUrl, themeName: selectedThemeName };
            saved.themeData["--subaccountThemes"] = JSON.stringify(sub);
            saveUserTheme(saved);
            locationId = locId;

            // Flash save button green as feedback
            saveBtn.textContent = "✔ Saved";
            saveBtn.style.background = "#28a745";
            setTimeout(() => {
                saveBtn.textContent = "Save";
                saveBtn.style.background = "#007bff";
            }, 2200);

            if (typeof applySubaccountTheme === "function") applySubaccountTheme();
        });

        // ── 5: Remove button ──
        const removeBtn = document.createElement("button");
        removeBtn.innerHTML = "🗑";
        removeBtn.title = "Remove this subaccount";
        removeBtn.style.cssText = `
            padding:7px;border:1px solid #ccc;border-radius:5px;
            background:#fff;color:#6c757d;font-size:14px;
            cursor:pointer;transition:all .2s;width:100%;
        `;
        removeBtn.onmouseenter = () => {
            removeBtn.style.background = "#fff0f0";
            removeBtn.style.borderColor = "#dc3545";
            removeBtn.style.color = "#dc3545";
        };
        removeBtn.onmouseleave = () => {
            removeBtn.style.background = "#fff";
            removeBtn.style.borderColor = "#ccc";
            removeBtn.style.color = "#6c757d";
        };
        removeBtn.addEventListener("click", () => {
            const idToRemove = locIdInput.value.trim() || locationId;
            if (idToRemove) {
                const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                saved.themeData = saved.themeData || {};
                let sub = saved.themeData["--subaccountThemes"] ? JSON.parse(saved.themeData["--subaccountThemes"]) : {};
                delete sub[idToRemove];
                saved.themeData["--subaccountThemes"] = JSON.stringify(sub);
                saveUserTheme(saved);
            }
            row.style.opacity = "0";
            row.style.transform = "scale(.97)";
            row.style.transition = "all .2s";
            setTimeout(() => row.remove(), 200);
        });

        row.appendChild(locIdInput);
        row.appendChild(logoUrlInput);
        row.appendChild(themeSelect);
        row.appendChild(saveBtn);
        row.appendChild(removeBtn);
        rowsWrapper.appendChild(row);

        // ── Load themes into dropdown ──
        (async function () {
            try {
                const res = await fetch("https://themebuilder-two.vercel.app/api/theme/getallthemes");
                const data = await res.json();

                themeSelect.innerHTML = "";
                const blankOpt = document.createElement("option");
                blankOpt.value = "";
                blankOpt.textContent = "— No theme change —";
                themeSelect.appendChild(blankOpt);

                data.themes.forEach(t => {
                    themes[t.themeName] = t.themeData;
                    const opt = document.createElement("option");
                    opt.value = t.themeName;
                    opt.textContent = t.themeName;
                    if (existingData?.themeName === t.themeName) opt.selected = true;
                    themeSelect.appendChild(opt);
                });
            } catch (err) {
                themeSelect.innerHTML = "";
                const errOpt = document.createElement("option");
                errOpt.value = "";
                errOpt.textContent = "❌ Failed to load";
                themeSelect.appendChild(errOpt);
                console.error("[ThemeBuilder] Failed to load themes:", err);
            }
        })();
    }
}
    function showPreviewPopup(type, popupUrl, popupHeadline, popupSubHeadline, popupButtonText) {
        document.getElementById("tb-preview-popup")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "tb-preview-popup";
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:200000;";

        const popup = document.createElement("div");
        popup.style.cssText = "position:relative;background:var(--themebuildermaincolor,#1A1A1A);padding:30px;border-radius:10px;max-width:350px;width:90%;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,0.3);";

        if (type === "simple") {
            popup.innerHTML = `<h3 class="modal-title">Access Denied</h3><p class="modal-title">You cannot access this feature.</p>`;
        } else if (type === "upgrade") {
            const headline    = popupHeadline    || "Upgrade Required 🚀";
            const subHeadline = popupSubHeadline || "This feature is available in Premium Plan.";
            const btnText     = popupButtonText  || "Upgrade";
            popup.innerHTML = `<h3 class="modal-title">${headline}</h3><p class="modal-title">${subHeadline}</p><button id="tb-popup-action-btn" style="margin-top:10px;padding:8px 16px;background:var(--scroll-color,#1A1A1A);color:#fff;border:none;border-radius:5px;cursor:pointer;">${btnText}</button>`;
        } else if (type === "contact") {
            const headline    = popupHeadline    || "Restricted";
            const subHeadline = popupSubHeadline || "Please contact admin to get access.";
            const btnText     = popupButtonText  || "Contact";
            popup.innerHTML = `<h3 class="modal-title">${headline}</h3><p class="modal-title">${subHeadline}</p><button id="tb-popup-action-btn" style="margin-top:10px;padding:8px 16px;background:var(--scroll-color,#1A1A1A);color:#fff;border:none;border-radius:5px;cursor:pointer;">${btnText}</button>`;
        }

        const actionBtn = popup.querySelector("#tb-popup-action-btn");
        if (actionBtn) {
            if (popupUrl) {
                actionBtn.addEventListener("click", () => window.open(popupUrl, "_blank"));
            } else {
                actionBtn.style.opacity = "0.5";
                actionBtn.style.cursor = "not-allowed";
                actionBtn.title = "No URL configured";
            }
        }

        const closeBtn = document.createElement("button");
        closeBtn.innerHTML = "&times;";
        closeBtn.style.cssText = "position:absolute;top:10px;right:14px;background:none;border:none;font-size:22px;line-height:1;color:#888;cursor:pointer;padding:0;";
        closeBtn.title = "Close";
        closeBtn.onclick = () => overlay.remove();

        popup.appendChild(closeBtn);
        overlay.appendChild(popup);
        document.body.appendChild(overlay);
    }

        function applyLockedMenus() {
        const savedRaw = localStorage.getItem("userTheme");
        const saved = JSON.parse(savedRaw) || {};
        if (!saved.themeData || !saved.themeData["--lockedMenus"]) return;

        let lockedMenus;
        try { lockedMenus = JSON.parse(saved.themeData["--lockedMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --lockedMenus"); return; }
        if (!lockedMenus || typeof lockedMenus !== "object") return;

        const locationId = getCurrentLocationId();

        const allMenus = document.querySelectorAll("a[id^='sb_'], .hl_nav-header a");

        allMenus.forEach(menu => {
            const menuId = menu.id?.trim();
            if (!menuId) return;

            // Read lockData ONCE — works for both location and global
            const lockData = locationId
                ? lockedMenus[locationId]?.[menuId]
                : lockedMenus[menuId];

            const isLocked = (lockData && typeof lockData === "object")
                ? lockData.locked
                : !!lockData;

            if (isLocked) {
                if (!menu.querySelector(".tb-lock-icon")) {
                    const lockIcon = document.createElement("i");
                    lockIcon.className = "tb-lock-icon fas fa-lock ml-2";
                    lockIcon.style.color = "#F54927";
                    lockIcon.style.setProperty("display", "inline-block", "important");
                    lockIcon.style.setProperty("visibility", "visible", "important");
                    lockIcon.style.setProperty("opacity", "1", "important");
                    lockIcon.style.setProperty("position", "relative", "important");
                    lockIcon.style.setProperty("z-index", "9999", "important");
                    menu.appendChild(lockIcon);
                }
                menu.style.setProperty("opacity", "0.6", "important");
                menu.style.setProperty("cursor", "not-allowed", "important");

                // Extract popup config from the single lockData read above
                const popupType = (lockData && typeof lockData === "object" && lockData.popupType) ? lockData.popupType : "simple";
                const popupUrl = (lockData && typeof lockData === "object" && lockData.popupUrl) ? lockData.popupUrl : "";
                const popupHeadline = (lockData && typeof lockData === "object" && lockData.popupHeadline) ? lockData.popupHeadline : "";
                const popupSubHeadline = (lockData && typeof lockData === "object" && lockData.popupSubHeadline) ? lockData.popupSubHeadline : "";
                const popupButtonText  = (lockData && typeof lockData === "object" && lockData.popupButtonText)  ? lockData.popupButtonText  : "";

                if (menu.dataset.tbLockBound !== "1") {
                        menu.addEventListener("click", (e) => {
                            blockMenuClick(e, menuId);
                        }, true);
                        menu.dataset.tbLockBound = "1";
                    }
            } else {
                const icon = menu.querySelector(".tb-lock-icon");
                if (icon) icon.remove();
                // menu.style.setProperty("opacity", "1", "important");
                // menu.style.setProperty("cursor", "auto", "important");
                if (menu.dataset.tbLockBound === "1") {
                    menu.removeEventListener("click", blockMenuClick, true);
                    delete menu.dataset.tbLockBound;
                }
            }
        });
    }

    document.addEventListener("DOMContentLoaded", applyLockedMenus);
   
    setTimeout(applyLockedMenus, 1500);

    // Helper for blocking click
    function cleanupMenuStates() {
        document.querySelectorAll("a[id^='sb_'], .hl_nav-header a").forEach(menu => {
            // Remove lock icon
            const icon = menu.querySelector(".tb-lock-icon");
            if (icon) icon.remove();

            // Reset lock styles
            // menu.style.removeProperty("opacity");
            // menu.style.removeProperty("cursor");

            // Reset hidden styles
            menu.style.removeProperty("display");
        });
    }
    window.cleanupMenuStates = cleanupMenuStates;
    window.__TB_cleanupMenuStates = cleanupMenuStates;
    function blockMenuClick(e, menuId) {
        // Guard: re-check current location before doing anything
        const savedRaw = localStorage.getItem("userTheme");
        const saved = JSON.parse(savedRaw) || {};
        const lockedMenus = saved.themeData?.["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
        const agencyData = saved.themeData?.["--agencyLockedHideMenus"] ? JSON.parse(saved.themeData["--agencyLockedHideMenus"]) : {};
        const locationId = getCurrentLocationId();
        const lockData = locationId
            ? lockedMenus[locationId]?.[menuId]
            : agencyData.locked?.[menuId];
        // Stale listener from a previous location — do nothing
        if (!lockData) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        const popupType = (lockData && typeof lockData === "object" && lockData.popupType) ? lockData.popupType : "simple";
        const popupUrl = (lockData && typeof lockData === "object" && lockData.popupUrl) ? lockData.popupUrl : "";
        const popupHeadline = (lockData && typeof lockData === "object" && lockData.popupHeadline) ? lockData.popupHeadline : "";
        const popupSubHeadline = (lockData && typeof lockData === "object" && lockData.popupSubHeadline) ? lockData.popupSubHeadline : "";
        const popupButtonText = (lockData && typeof lockData === "object" && lockData.popupButtonText) ? lockData.popupButtonText : "";
        showPreviewPopup(popupType, popupUrl, popupHeadline, popupSubHeadline, popupButtonText);
    }
        function updateIconVariable(menuId, unicodeValue) {
            const cssVarName = getCssVarName(menuId);
            if (!cssVarName) {
                return;
            }
            // ✅ Format the unicode properly
            if (!unicodeValue.startsWith("\\f")) {
                unicodeValue = "\\" + unicodeValue;
            }

            document.documentElement.style.setProperty(cssVarName, `"${unicodeValue}"`);
        }
    function getCssVarName(menuId) {
            const map = {
                "sb_agency-dashboard": "--agency-dashboard-icon",
                "sb_agency-saas-configurator": "--agency-sass-configurator-icon",
                "sb_location-prospect": "--agency-prospect-icon",
                "sb_agency-accounts": "--agency-subaccount-icon",
                "sb_agency-account-snapshots": "--agency-snapshot-icon",
                "sb_agency-account-reselling": "--agency-reselling-icon",
                "sb_agency-marketplace": "--agency-marketplace-icon",
                "sb_agency-affiliate-portal": "--agency-affiliate-icon",
                "sb_agency-template-library": "--agency-templatelibrary-icon",
                "sb_agency-partners": "--agency-partners-icon",
                "sb_agency-university": "--agency-university-icon",
                "sb_saas-education": "--agency-sasseducation-icon",
                "sb_ghl-swag": "--agency-sassswag-icon",
                "sb_saas-fasttrack": "--agency-sassfasttrack-icon",
                "sb_agency-ideas": "--agency-ideas-icon",
                "sb_mobile-app-customiser": "--agency-mobileapp-icon",
                "sb_agency-app-marketplace": "--agency-app-marketplace-icon",
                "sb_agency-settings": "--agency-settings-icon",
                "sb_launchpad":"--sidebar-menu-icon-lunchpad",
                "sb_dashboard":"--sidebar-menu-icon-dashboard-active",
                "sb_conversations":"--sidebar-menu-icon-conversations",
                "sb_opportunities":"--sidebar-menu-icon-opportunities",
                "sb_calendars":"--sidebar-menu-icon-calendars",
                "sb_contacts":"--sidebar-menu-icon-contact",
                "sb_payments":"--sidebar-menu-icon-payments",
                "sb_reporting":"--sidebar-menu-icon-reporting",
                "sb_email-marketing":"--sidebar-menu-icon-marketing",
                "sb_automation":"--sidebar-menu-icon-automation",
                "sb_sites":"--sidebar-menu-icon-site",
                "sb_app-media":"--sidebar-menu-icon-media-storage",
                "sb_memberships":"--sidebar-menu-icon-memberships-hover",
                "sb_reputation":"--sidebar-menu-icon-reputation",
            };

            return map[menuId] || null;
        }

    function applyMenuIconCustomizations() {
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme?.themeData || {};
        const rawCustomizations = themeData["--menuCustomizations"];

        if (!rawCustomizations) {
            return;
        }

        // Parse string if needed
        const customizations =
            typeof rawCustomizations === "string"
                ? JSON.parse(rawCustomizations)
                : rawCustomizations;

        // 🔁 Loop through each menu item and apply icon
        Object.entries(customizations).forEach(([menuId, data]) => {
            const cssVar = getCssVarName(menuId);
            const iconUnicode = data?.icon;

            if (cssVar && iconUnicode) {
                // Make sure it’s formatted correctly for CSS content
                document.documentElement.style.setProperty(
                    cssVar,
                    `"\\${iconUnicode}"`
                );
            } else {
            }
        });
    }
    function applyMenuCustomizations() {
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        window.__tbApplyMenuCustomizations = applyMenuCustomizations;


        const themeData = savedTheme.themeData || {};
        const menuCustomizations = themeData["--menuCustomizations"]
            ? JSON.parse(themeData["--menuCustomizations"])
            : {};

        // Load Font Awesome if missing
        if (!document.querySelector('link[href*="font-awesome"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
            link.onload = () => applyMenuCustomizations();
            document.head.appendChild(link);
            return;
        }

        Object.keys(menuCustomizations).forEach(menuId => {
            const menuData = menuCustomizations[menuId];
            const menuEl = document.getElementById(menuId);
            if (!menuEl) return;

            // Update Title
            const titleSpan = menuEl.querySelector(".nav-title");
            if (titleSpan) titleSpan.textContent = menuData.title || menuEl.dataset.defaultLabel || "";
                        if (menuData.icon) {
    // ✅ Skip DOM work if icon is already correct — prevents visual flash
                const existingIcon = menuEl.querySelector("i.tb-sidebar-icon, img.tb-sidebar-icon-img");
                if (existingIcon && existingIcon.dataset.tbIcon === menuData.icon) {
                    // icon already applied, title-only update above is enough
                } else {
                    // Remove old icons
                    const existingImg = menuEl.querySelector("img");
                    const existingI = menuEl.querySelector("i");
                    if (existingImg) existingImg.remove();
                    if (existingI) existingI.remove();

                    // Clear old CSS mask icon
                    const cssVarName = `--sidebar-menu-icon-${menuId.replace(/^sb_/, "")}`;
                    document.documentElement.style.setProperty(cssVarName, "");

                    menuEl.classList.remove('tb-has-svg-icon');

                    // ✅ Create the icon element FIRST, then prepend
                    let iconEl;
                    if (/^https?:\/\//.test(menuData.icon)) {
                        iconEl = document.createElement("img");
                        iconEl.src = menuData.icon;
                        iconEl.alt = menuData.title || "icon";
                        iconEl.className = "md:mr-0 h-5 w-5 mr-2 lg:mr-2 xl:mr-2 tb-sidebar-icon-img"; // ✅ add tb-sidebar-icon-img so selector works next call
                    } else if (/^f[0-9a-f]+$/i.test(menuData.icon)) {
                        const iconValue = menuData.icon.toLowerCase();
                        const BRAND_UNICODE_RANGE = ["f09a", "f16d", "f232", "f436"];
                        const isBrandIcon = BRAND_UNICODE_RANGE.includes(iconValue);
                        iconEl = document.createElement("i");
                        iconEl.className = "tb-sidebar-icon";
                        iconEl.innerHTML = `&#x${iconValue};`;
                        iconEl.style.fontFamily = isBrandIcon ? "Font Awesome 6 Brands" : "Font Awesome 6 Free";
                        iconEl.style.fontWeight = isBrandIcon ? "400" : "900";
                        iconEl.style.fontSize = "16px";
                        iconEl.style.marginRight = "0.5rem";
                        iconEl.style.lineHeight = "1";
                    } else {
                        let iconValue = menuData.icon.trim();
                        if (/^f[0-9a-f]{3}$/i.test(iconValue)) {
                            iconEl = document.createElement("i");
                            iconEl.className = "fa-regular tb-sidebar-icon";
                            iconEl.innerHTML = `&#x${iconValue};`;
                            iconEl.style.fontFamily = "Font Awesome 6 Free";
                            iconEl.style.fontWeight = "900";
                        } else {
                            if (iconValue.startsWith("fa-") && !iconValue.includes("fa-regular") && !iconValue.includes("fa-brands")) {
                                iconValue = `fa-regular ${iconValue}`;
                            } else if (!iconValue.startsWith("fa-")) {
                                iconValue = `fa-regular fa-${iconValue}`;
                            }
                            iconEl = document.createElement("i");
                            iconEl.className = `${iconValue} tb-sidebar-icon`;
                            iconEl.style.fontFamily = "Font Awesome 6 Free";
                            iconEl.style.fontWeight = "900";
                            iconEl.style.fontSize = "16px";
                            iconEl.style.marginRight = "0.5rem";
                        }
                    }

                    if (iconEl) {
                        iconEl.dataset.tbIcon = menuData.icon; // ✅ mark for next-call check
                        menuEl.prepend(iconEl);                // ✅ only called once, after creation
                    }

                    // Toggle classes for CSS
                    if (/^f[0-9a-f]+$/i.test(menuData.icon)) {
                        menuEl.classList.add("tb-has-fa-icon");
                        menuEl.classList.remove("tb-has-svg-icon");
                    } else if (/^https?:\/\//.test(menuData.icon)) {
                        menuEl.classList.remove("tb-has-fa-icon");
                        menuEl.classList.add("tb-has-svg-icon");
                    }

                    const titleEl = menuEl.querySelector(".nav-title");
                    if (titleEl) titleEl.style.right = "28px";
                }
            }
            // Force repaint so FA glyphs render without needing a click
            requestAnimationFrame(() => {
                document.querySelectorAll(".tb-sidebar-icon").forEach(el => {
                    el.style.display = "none";
                    // eslint-disable-next-line no-unused-expressions
                    el.offsetHeight; // trigger reflow
                    el.style.display = "";
                });
            });
        });
    }

    function buildMenuCustomizationSection(container) {
        if (document.getElementById("tb-menu-customization")) return;

        const wrapper = document.createElement("div");
        wrapper.id = "tb-menu-customization";
        wrapper.className = "tb-menu-customization";

        const separator = document.createElement("hr");
        separator.className = "tb-section-separator";
        wrapper.appendChild(separator);
             function getAgencyMenusFromDOM() {
            const sidebar = document.querySelector('#sidebar-v2');
            if (!sidebar) return [];
            const menuEls = sidebar.querySelectorAll('a[id^="sb_"]');
            const seen = {}; // track duplicate IDs

            return Array.from(menuEls)
                .filter(el =>
                    el.id &&
                    el.id !== "sb_" &&
                    !el.id.toLowerCase().includes("setting")
                )
                .map(el => {
                    // Use img alt text first — most reliable, GHL uses it to distinguish
                    // duplicates like sb_agency-accounts (Sub-Accounts vs App Marketplace)
                    const imgAlt = el.querySelector('img[alt]')?.getAttribute('alt')
                        ?.replace(/\s*icon$/i, '').trim();

                    const span = el.querySelector('span:not([class*="icon"]):not([class*="dot"])');
                    const spanText = span?.textContent?.trim();

                    const label = imgAlt || spanText
                        || el.id.replace(/^sb_agency-/, '').replace(/-/g, ' ')
                               .replace(/\b\w/g, c => c.toUpperCase());

                    // Handle duplicate IDs — give second occurrence a unique key
                    let uniqueId = el.id;
                    if (seen[el.id]) {
                        uniqueId = el.id + "--" + label.toLowerCase().replace(/\s+/g, '-');
                    }
                    seen[el.id] = true;

                    return { id: uniqueId, originalId: el.id, label };
                });
        }

        function getSubAccountMenusFromDOM() {
            const sidebar = document.querySelector('#sidebar-v2');
            if (!sidebar) return [];

            const menuEls = sidebar.querySelectorAll('a[id^="sb_"]');
            return Array.from(menuEls)
                .filter(el => el.id && el.id !== "sb_")
                .map(el => {
                    const span = el.querySelector('span:not([class*="icon"]):not([class*="dot"])');
                    const label = span?.textContent?.trim()
                        || el.id.replace(/^sb_/, '').replace(/-/g, ' ')
                            .replace(/\b\w/g, c => c.toUpperCase());
                    return { id: el.id, label };
                });
        }
        function buildFromSavedOrder(orderKey, labelMap) {
            try {
                const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                const order = saved.themeData?.[orderKey]
                    ? JSON.parse(saved.themeData[orderKey])
                    : [];
                if (!order.length) return null; // nothing saved yet
                return order.map(id => ({
                    id,
                    label: labelMap[id]
                        || id.replace(/^sb_(agency-)?/, "")
                            .replace(/-/g, " ")
                            .replace(/\b\w/g, c => c.toUpperCase())
                }));
            } catch (e) { return null; }
        }
        // ✅ ADD THIS — strips settings from any menu source
        function excludeSettings(menus) {
            return menus.filter(m => !m.id.toLowerCase().includes("setting"));
        }
        // let subAccountMenus = getSubAccountMenusFromDOM();
      const SUBACCOUNT_LABEL_MAP = {
            "sb_launchpad": "Launchpad", "sb_dashboard": "Dashboard",
            "sb_conversations": "Conversations", "sb_opportunities": "Opportunities",
            "sb_calendars": "Calendars", "sb_contacts": "Contacts",
            "sb_payments": "Payments", "sb_vibe": "AI Studio",
            "sb_reporting": "Reporting", "sb_email-marketing": "Email Marketing",
            "sb_automation": "Automation", "sb_sites": "Sites",
            "sb_app-media": "Media Storage", "sb_memberships": "Memberships",
            "sb_reputation": "Reputation"
        };
        const AGENCY_LABEL_MAP = {
            "sb_agency-dashboard": "Agency Dashboard", "sb_location-prospect": "Prospecting",
            "sb_agency-account-reselling": "Account Reselling", "sb_agency-marketplace": "Add-Ons",
            "sb_agency-affiliate-portal": "Affiliate Portal", "sb_agency-template-library": "Template Library",
            "sb_agency-partners": "Partners", "sb_agency-university": "University",
            "sb_saas-education": "SaaS Education", "sb_ghl-swag": "GHL Swag",
            "sb_agency-saas-configurator": "Saas Configurator", "sb_agency-ideas": "Agency Ideas",
            "sb_mobile-app-customiser": "Mobile App Customiser", "sb_agency-account-snapshots": "Account Snapshots",
            "sb_agency-launchpad": "Launchpad", "sb_agency-ai-usage": "AI Usage",
            "sb_desktop-whitelabel-app": "Desktop Whitelabel App",
            "sb_agency-accounts--app-marketplace": "App Marketplace"  
        };
        const DEFAULT_SUBACCOUNT_MENUS = Object.entries(SUBACCOUNT_LABEL_MAP).map(([id, label]) => ({ id, label }));
        const DEFAULT_AGENCY_MENUS     = Object.entries(AGENCY_LABEL_MAP).map(([id, label]) => ({ id, label }));
        const isSubAccountLevel = location.pathname.includes("/location/");
        // ── Subaccount menus ──────────────────────────────────────────────
        let subAccountMenus;
        if (isSubAccountLevel) {
            const fromDom = getSubAccountMenusFromDOM();
            subAccountMenus = fromDom.length > 0
                ? fromDom
                : (buildFromSavedOrder("--subMenuOrder", SUBACCOUNT_LABEL_MAP) || DEFAULT_SUBACCOUNT_MENUS);
        } else {
            subAccountMenus = buildFromSavedOrder("--subMenuOrder", SUBACCOUNT_LABEL_MAP) || DEFAULT_SUBACCOUNT_MENUS;
        }
        subAccountMenus = excludeSettings(subAccountMenus); // ✅ always filter after any source

        // ── Agency menus ──────────────────────────────────────────────────
        let agencyMenus;
        if (!isSubAccountLevel) {
            const fromDom = getAgencyMenusFromDOM();
            agencyMenus = fromDom.length > 0
                ? fromDom
                : (buildFromSavedOrder("--agencyMenuOrder", AGENCY_LABEL_MAP) || DEFAULT_AGENCY_MENUS);
        } else {
            agencyMenus = buildFromSavedOrder("--agencyMenuOrder", AGENCY_LABEL_MAP) || DEFAULT_AGENCY_MENUS;
        }
        agencyMenus = excludeSettings(agencyMenus); // ✅ always filter after any source
        
        // ✅ Debug: check if your menus arrays are defined correctly
        // Load saved theme 
        const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedTheme.themeData || {};

        // ---------------- Helper to build each section ----------------
        const buildSection = (menus, sectionTitle, storageKey, sidebarParentSelector) => {
            const sectionHeading = document.createElement("h4");
            sectionHeading.className = "tb-header-controls-cursor";
            sectionHeading.textContent = sectionTitle;
            sectionHeading.style.cursor = "var(--custom-pointer,auto)"; // Make clickable
            sectionHeading.style.alignItems = "center";

             // Add arrow for toggle
            const arrow = document.createElement("span");
            arrow.innerHTML = `<i class="fa-solid fa-angle-down tb-toggle-icon" style="color:white;margin-right:6px;font-size:16px; border-radius: 4px; border: 2px solid #ffffff; padding: 0px 2px 0px 2px;"></i>`;
            arrow.style.marginLeft = "8px";
            sectionHeading.appendChild(arrow);
            wrapper.appendChild(sectionHeading);

            const listContainer = document.createElement("div");
            listContainer.className = "tb-draggable-menu-list tb-section-container";
            listContainer.style.overflow = "hidden";
            listContainer.style.maxHeight = "0px";
            listContainer.style.transition = "max-height 0.3s ease, padding 0.3s ease";
            //const savedOrder = themeData[storageKey] ? JSON.parse(themeData[storageKey]) : [];
            //if (savedOrder.length > 0) {
            //    const indexOf = id => {
            //        const idx = savedOrder.indexOf(id);
            //        return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
            //    };
            //    menus.sort((a, b) => indexOf(a.id) - indexOf(b.id));
            //}
            const savedOrder = themeData[storageKey] ? JSON.parse(themeData[storageKey]) : [];

            if (Array.isArray(savedOrder) && savedOrder.length > 0) {
                // Reorder menus according to saved order only
                const orderedMenus = [];
                savedOrder.forEach(id => {
                    const found = menus.find(m => m.id === id);
                    if (found) orderedMenus.push(found);
                });

                // Add any new menus not in savedOrder (to preserve new additions)
                menus.forEach(m => {
                    if (!savedOrder.includes(m.id)) orderedMenus.push(m);
                    
                });

                menus = orderedMenus;
            }
            menus.forEach(menu => {
                const row = document.createElement("div");
                row.className = "tb-menu-row";
                row.dataset.id = menu.id;
                row.style.display = "flex";
                row.style.alignItems = "center";
                row.style.gap = "8px";
                row.style.marginBottom = "10px";
                row.style.border = "1px solid #ddd";
                row.style.padding = "8px";
                row.style.borderRadius = "6px";
                row.style.background = "#f9f9f9";
                row.style.boxShadow = "-2px 2px 10px rgb(78 77 189 / 21%)";

                // 🖼️ Add drag icon before label
                const dragIcon = document.createElement("img");
                dragIcon.src = "https://themebuilder-two.vercel.app/images/drag-logo-2.png";
                dragIcon.alt = "drag";
                dragIcon.className = "tb-drag-handle"; // 👈 important for Sortable handle
                dragIcon.style.width = "15px";
                dragIcon.style.height = "15px";
                dragIcon.style.objectFit = "contain";
                dragIcon.style.cursor = "grab";

                const label = document.createElement("span");
                label.textContent = menu.label;
                label.style.flex = "1";

                const titleInput = document.createElement("input");
                titleInput.type = "text";
                titleInput.placeholder = "Custom Title";
                titleInput.className = "tb-input tb-title-input";
                // 🔥 Live title update as user types
                titleInput.addEventListener("input", (e) => {
                    const newLabel = e.target.value.trim();
                    const rawKey = menu.id.startsWith("sb_") ? menu.id.replace(/^sb_/, "") : menu.id;
                    updateSidebarTitle(rawKey, newLabel || menu.label);
                });
                const iconInput = document.createElement("input");
                iconInput.type = "text";
                iconInput.placeholder = "CODE";
                iconInput.className = "tb-input tb-icon-input";

                const menuCustomizations = themeData["--menuCustomizations"]
                    ? JSON.parse(themeData["--menuCustomizations"])
                    : {};

                if (menuCustomizations[menu.id]) {
                    titleInput.value = menuCustomizations[menu.id].title || "";
                    iconInput.value = menuCustomizations[menu.id].icon || "";
                } else {
                    titleInput.value = menu.label;
                }
                //Old Code
                const saveChange = () => {
                    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                    saved.themeData = saved.themeData || {};

                    const customizations = saved.themeData["--menuCustomizations"]
                        ? JSON.parse(saved.themeData["--menuCustomizations"])
                        : {};

                    let iconValue = iconInput.value.trim();
                    let isUnicode = false;

                    // ✅ Detect if user pasted only Unicode like "f015"
                    if (/^f[0-9a-fA-F]{3}$/i.test(iconValue)) {
                        isUnicode = true;
                    }

                    customizations[menu.id] = {
                        title: titleInput.value,
                        icon: iconValue
                    };

                    saved.themeData["--menuCustomizations"] = JSON.stringify(customizations);
                    saveUserTheme(saved);

                    // Apply title instantly via CSS variable
                    const varName = `--${menu.id}-new-name`;
                    document.documentElement.style.setProperty(varName, `"${titleInput.value || menu.label}"`);

                    // 🔄 Update icon live
                    const menuEl = document.getElementById(menu.id);
                    if (menuEl) {
                        let iconEl = menuEl.querySelector("i");
                        if (!iconEl) {
                            iconEl = document.createElement("i");
                            menuEl.prepend(iconEl);
                        }

                        if (isUnicode) {
                            // ✅ Update the CSS variable instead of injecting icon manually
                            updateIconVariable(menu.id, iconValue);

                            // Optional: Add a fallback <i> for safety (not strictly required)
                            iconEl.className = "fa-solid";
                            iconEl.textContent = String.fromCharCode(parseInt(iconValue, 16));
                            iconEl.style.fontFamily = "Font Awesome 6 Free";
                            iconEl.style.fontWeight = "900";
                            iconEl.style.marginRight = "0.5rem";
                            iconEl.style.fontSize = "16px";
                        } else {
                            // ✅ User entered a normal class or URL
                            iconEl.textContent = "";

                            // 🧠 Auto-correct class before assigning
                            let finalClass = iconValue.trim();

                            // If accidentally Unicode, fallback
                            if (/^f[0-9a-f]{3}$/i.test(finalClass)) {
                                iconEl.className = "fa-solid";
                                iconEl.textContent = String.fromCharCode(parseInt(finalClass, 16));
                                iconEl.style.fontFamily = "Font Awesome 6 Free";
                                iconEl.style.fontWeight = "900";
                            } else {
                                // Normalize normal icon class
                                if (finalClass.startsWith("fa-") && !finalClass.includes("fa-solid") && !finalClass.includes("fa-regular") && !finalClass.includes("fa-brands")) {
                                    finalClass = `fa-solid ${finalClass}`;
                                } else if (!finalClass.startsWith("fa-")) {
                                    finalClass = `fa-solid fa-${finalClass}`;
                                }

                                iconEl.className = finalClass;
                                iconEl.textContent = "";
                                iconEl.style.fontFamily = "Font Awesome 6 Free";
                                iconEl.style.fontWeight = "900";
                            }

                        }
                    }
                    // function waitForFontAwesome(cb) {
                    //     const test = document.createElement("i");
                    //     test.className = "fa-solid fa-house";
                    //     document.body.appendChild(test);
                    //     requestAnimationFrame(() => {
                    //         const style = getComputedStyle(test).fontFamily;
                    //         test.remove();
                    //         if (style.includes("Font Awesome")) {
                    //             cb();
                    //         } else {
                    //             setTimeout(() => waitForFontAwesome(cb), 100);
                    //         }
                    //     });
                    // }
                    function waitForFontAwesome(cb) {
                            if (document.fonts && document.fonts.ready) {
                                document.fonts.ready.then(() => {
                                    // Extra check: ensure FA glyphs are actually available
                                    document.fonts.load('900 16px "Font Awesome 6 Free"').then(() => {
                                        cb();
                                    }).catch(() => cb()); // fallback: call anyway
                                });
                            } else {
                                // Fallback for older browsers
                                const test = document.createElement("i");
                                test.className = "fa-solid fa-house";
                                test.style.cssText = "position:absolute;visibility:hidden;font-size:16px;";
                                document.body.appendChild(test);
                                
                                let attempts = 0;
                                const check = () => {
                                    attempts++;
                                    const width = test.getBoundingClientRect().width;
                                    if (width > 0) {
                                        test.remove();
                                        cb();
                                    } else if (attempts < 50) {
                                        setTimeout(check, 100);
                                    } else {
                                        test.remove();
                                        cb(); // give up and apply anyway
                                    }
                                };
                                requestAnimationFrame(check);
                            }
                        }

                    waitForFontAwesome(applyMenuCustomizations);
                };

                titleInput.addEventListener("input", saveChange);
                iconInput.addEventListener("input", saveChange);

                // ✅ Correct append order
                row.appendChild(dragIcon);  // use dragIcon instead of dragHandle
                row.appendChild(label);
                row.appendChild(titleInput);
                row.appendChild(iconInput);

                listContainer.appendChild(row);
            });

            wrapper.appendChild(listContainer);
            sectionHeading.addEventListener("click", () => {
                const icon = arrow.querySelector("i");

                if (listContainer.classList.contains("open")) {
                    // Collapse
                    listContainer.style.maxHeight = "0px";
                    listContainer.style.padding = "0 0";
                    listContainer.classList.remove("open");

                    icon.classList.remove("fa-angle-up");
                    icon.classList.add("fa-angle-down"); // collapsed icon
                } else {
                    // Expand
                    listContainer.style.maxHeight = listContainer.scrollHeight + "px";
                    listContainer.style.padding = "10px 0";
                    listContainer.classList.add("open");

                    icon.classList.remove("fa-angle-down");
                    icon.classList.add("fa-angle-up"); // expanded icon
                }
            });
         
                function saveSubaccountOrder(order) {
                const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                saved.themeData ??= {};
                saved.themeData["--subMenuOrder"] = JSON.stringify(order);
                saveUserTheme(saved);
                }
            const isSubAccounta = location.pathname.includes("/location/");
            let allowReorder = false;
           
            // ---------------- Drag & Drop ----------------
            Sortable.create(listContainer, {
                animation: 150,
                ghostClass: "tb-dragging",
                handle: ".tb-drag-handle",

                onEnd: () => {
                    allowReorder = true; // enable once, only after drag
                    const rows = listContainer.querySelectorAll(".tb-menu-row");
                    const newOrder = [...rows].map(r => r.dataset.id);

                    // Save
                    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                    saved.themeData ??= {};
                    saved.themeData[storageKey] = JSON.stringify(newOrder);
                    saveUserTheme(saved);

                    if (isSubAccounta) {

                                saveSubaccountOrder(newOrder);
                                window.applySubaccountMenuOrderCSS(newOrder); // 🔥 LIVE APPLY

                                applyMenuCustomizations();
                        } else {
                        updateAgencyaccountSidebarRuntime(newOrder);
                    }

                    applyMenuCustomizations();
                }
            });
        };

        // 💡 Add Instruction Paragraph under Agency Level Menu Customization
        const instruction = document.createElement("p");
        instruction.className = "tb-instruction-text";
        instruction.innerHTML = `
           💡 <strong>How to Customize Your Menu:</strong><br><br>
           1. To add a custom icon for any menu item, please visit the 
           <a href="https://fontawesome.com/icons" target="_blank" style="color:#007bff00; text-decoration:underline;">
             Font Awesome Icons Library
           </a>. Once there, select your preferred icon. On the <strong>top-right corner</strong> of the icon page, you’ll find a <strong>“Copy Code”</strong> button — click it and then <strong>paste the copied code into the relevant icon field</strong> here.<br><br>
           2. You can <strong>drag and drop the menu items</strong> to change their order. This helps you organize your dashboard according to your preferences or workflow.<br><br>
           3. To <strong>change the title of any menu item</strong>, simply edit the text in the <strong>relevant title field</strong>. This allows you to personalize your menu names for better clarity and easier navigation.<br><br>
           ✨ <em>Tip:</em> Use these customization options to design a navigation layout that’s tailored to your needs — improving productivity and making your workspace more intuitive.
         `;
        wrapper.appendChild(instruction);

        // pass safeAgencyMenus / safeSubAccountMenus to buildSection
        buildSection(agencyMenus, "Agency Level", "--agencyMenuOrder", "#agencySidebar");
        buildSection(subAccountMenus, "Sub-Account Level", "--subMenuOrder", "#subAccountSidebar");


        container.appendChild(wrapper);
        applyMenuCustomizations();

        

        (function applySavedAgencyOrderOnLoad() {
            // Only run on agency level (not inside /location/)
            if (location.pathname.includes("/location/")) return;

            const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
            const order = saved.themeData?.["--agencyMenuOrder"]
                ? JSON.parse(saved.themeData["--agencyMenuOrder"])
                : [];

            if (!order.length) return;

            // Wait for the nav to exist, then apply
            const apply = () => {
                const sidebarNav = document.querySelector('.hl_nav-header nav[aria-label="header"]');
                if (!sidebarNav) return false;

                const metaOrder = order.map(id => id.replace(/^sb_/, ""));

                metaOrder.forEach(metaKey => {
                    const el = sidebarNav.querySelector(`[meta="${metaKey}"]`);
                    if (el) sidebarNav.appendChild(el);
                });

                // ✅ New menus GHL added go to the end
                sidebarNav.querySelectorAll('[meta]').forEach(el => {
                    const metaVal = el.getAttribute('meta');
                    if (!metaOrder.includes(metaVal)) sidebarNav.appendChild(el);
                });

                return true;
            };

            // Try immediately, then retry until sidebar is ready
            if (!apply()) {
                const retryInterval = setInterval(() => {
                    if (apply()) clearInterval(retryInterval);
                }, 100);
                // Stop retrying after 10 seconds
                setTimeout(() => clearInterval(retryInterval), 10000);
            }
        })();
                
        // ✅ Restore order if sidebar exists
        const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");

        const isSubAccountb = location.pathname.includes("/location/");

        if (!isSubAccountb && saved.themeData?.["--agencyMenuOrder"]) {
            const order = JSON.parse(saved.themeData["--agencyMenuOrder"]);
            reorderMenu(order, "#agencySidebar");
        }

        function reorderMenu(order, containerSelector) {
                let container = document.querySelector(containerSelector);
                if (!container) {
                    for (let i = 0; i < order.length; i++) {
                        const id = order[i];
                        const el = document.getElementById(id);
                        if (el && el.parentElement) {
                            container = el.parentElement;
                            break;
                        }
                    }
                }
                if (!container) {
                    container = document.querySelector(".hl_nav-header nav") || document.querySelector(".hl_nav-header");
                }
                if (!container) return;
                window.__TB_REORDERING__ = true;
                order.forEach(id => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    if (el.parentElement !== container) {
                        container.appendChild(el);
                    }
                });
                requestAnimationFrame(() => { window.__TB_REORDERING__ = false; });
            }

    }

    function updateSidebarTitle(metaKey, newLabel) {
        // 🚫 Prevent title change for this menu only
        if (metaKey === "agency-accounts") {
            console.warn("Skipping update for sb_agency-accounts");
            return;
        }

        const varName = `--${metaKey}-new-name`;

        // Inject CSS rule only once
        if (!document.querySelector(`style[data-meta="${metaKey}"]`)) {
            const style = document.createElement("style");
            style.dataset.meta = metaKey;
            style.innerHTML = `
    a[meta="${metaKey}"] .nav-title,
    a#${metaKey} .nav-title {
      visibility: hidden !important;
      position: relative !important;
    }
    a[meta="${metaKey}"] .nav-title::after,
    a#${metaKey} .nav-title::after {
      content: var(${varName}, "${metaKey}");
      visibility: visible !important;
      position: absolute !important;
      left: 0;
    }
  `;
            document.head.appendChild(style);
        }

        // Apply CSS variable
        document.documentElement.style.setProperty(varName, `"${newLabel}"`);

        // Save
        const saved = JSON.parse(localStorage.getItem("--themebuilder_sidebarTitles") || "{}");
        saved[varName] = newLabel;
        localStorage.setItem("--themebuilder_sidebarTitles", JSON.stringify(saved));
    }

    function restoreSidebarTitles() {
        const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
        if (saved.themeData && saved.themeData["--sidebarTitles"]) {
            try {
                const titles = JSON.parse(saved.themeData["--sidebarTitles"]);
                Object.entries(titles).forEach(([varName, value]) => {

                    // 🚫 Skip restore for sb_agency-accounts
                    if (varName.includes("agency-accounts")) return;

                    document.documentElement.style.setProperty(varName, `"${value}"`);
                });
            } catch (err) {
                console.error("❌ Failed to restore sidebar titles:", err);
            }
        }
    }

    restoreSidebarTitles();

    function buildFeedbackForm(section) {
        // Wrapper
        const wrapper = document.createElement("div");
        wrapper.className = "tb-bg-gradient-settings";
        wrapper.id = "tb-feedback-form";
        wrapper.style.marginTop = "16px";

        // Title
        const title = document.createElement("h4");
        title.className = "tb-section-background-title";
        title.innerText = "Send Us Your Feedback";
        wrapper.appendChild(title);

        // ✅ Add description paragraph below title
        const infoPara = document.createElement("p");
        infoPara.className = "tb-instruction-text";
        infoPara.textContent = "If you have any suggestions for ThemeBuilder that need to be updated or changed, please send us your feedback using this form below.";
        wrapper.appendChild(infoPara);

        // ✅ Embed iframe instead of custom form
        const iframe = document.createElement("iframe");
        iframe.src = "https://api.glitchgone.com/widget/form/lv8RbD6M9IzPnummFGHC";
        iframe.style.width = "100%";
        iframe.style.height = "100%";
        iframe.style.border = "none";
        iframe.style.borderRadius = "10px";

        // Copy over the data attributes if needed:
        iframe.id = "inline-lv8RbD6M9IzPnummFGHC";
        iframe.setAttribute("data-layout", "{'id':'INLINE'}");
        iframe.setAttribute("data-trigger-type", "alwaysShow");
        iframe.setAttribute("data-trigger-value", "");
        iframe.setAttribute("data-activation-type", "alwaysActivated");
        iframe.setAttribute("data-activation-value", "");
        iframe.setAttribute("data-deactivation-type", "neverDeactivate");
        iframe.setAttribute("data-deactivation-value", "");
        iframe.setAttribute("data-form-name", "Theme Builder Feedback Form");
        iframe.setAttribute("data-height", "534");
        iframe.setAttribute("data-layout-iframe-id", "inline-lv8RbD6M9IzPnummFGHC");
        iframe.setAttribute("data-form-id", "lv8RbD6M9IzPnummFGHC");
        iframe.title = "Theme Builder Feedback Form";

        wrapper.appendChild(iframe);

        // ✅ Dynamically load the script
        const script = document.createElement("script");
        script.src = "https://api.glitchgone.com/js/form_embed.js";
        script.async = true;
        wrapper.appendChild(script);

        // Append wrapper to section
        section.appendChild(wrapper);
    }

    function reapplyThemeOnRouteChange() {
                waitForSidebarMenus(() => {
                    applyLockedMenus();
                    applyMenuCustomizations();
                    initThemeBuilder(0);
                    // applyMenuIconCustomizations();

                    // ✅ Restore saved menu order on every route change
                    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
                    const isSubAccount = location.pathname.includes("/location/");

                    if (isSubAccount) {
                        // Subaccount order — re-inject the CSS
                        const subOrder = saved.themeData?.["--subMenuOrder"]
                            ? JSON.parse(saved.themeData["--subMenuOrder"])
                            : [];
                        if (subOrder.length) window.applySubaccountMenuOrderCSS(subOrder);
                    } else {
                        // Agency order — re-inject the CSS
                        const agencyOrder = saved.themeData?.["--agencyMenuOrder"]
                            ? JSON.parse(saved.themeData["--agencyMenuOrder"])
                            : [];
                        if (agencyOrder.length) window.updateAgencyaccountSidebarRuntime(agencyOrder);
                    }
                });
            }

    (function () {
    window.addEventListener("locationchange", () => { 
        if (window.__TB_NAV_TRANSITION__) return;
        reapplyThemeOnRouteChange();
    });

    reapplyThemeOnRouteChange();
})();

    function applySavedSettings() {
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeData = savedThemeObj.themeData || {};

        // ✅ If we're on a subaccount that has its own theme, skip agency vars entirely
        const locationId = (typeof getCurrentLocationId === "function") ? getCurrentLocationId() : null;
        if (locationId && themeData["--subaccountThemes"]) {
            try {
                const sub = JSON.parse(themeData["--subaccountThemes"]);
                if (sub && sub[locationId] && sub[locationId].themeName) {
                    // Let applySubaccountTheme own the styling here
                    if (typeof applySubaccountTheme === "function") applySubaccountTheme();
                    const sidebarText = localStorage.getItem("sidebarTextColor");
                    if (sidebarText) applySidebarTextColor(sidebarText);
                    return;
                }
            } catch (e) {}
        }

        // ✅ Apply to :root (documentElement), NOT body — keeps cascade consistent with everything else
        const root = document.documentElement;
        Object.entries(themeData).forEach(([key, value]) => {
            if (key.startsWith("--") && value && value !== "undefined" && typeof value === "string") {
                try { root.style.setProperty(key, value); } catch (e) {}
            }
        });

            const sidebarText = localStorage.getItem("sidebarTextColor");
            if (sidebarText) applySidebarTextColor(sidebarText);
    }
    // Create Builder UI
    function createBuilderUI(controlsContainer) {
        const existingIcon = document.getElementById("hl_header--themebuilder-icon");
        const existingDrawer = document.getElementById("themeBuilderDrawer");
        

        // 🛠️ If UI already exists, just rebind listeners and return
        if (existingIcon && existingDrawer) {
            bindThemeBuilderEvents(existingIcon, existingDrawer);
            return;
        }

        if (!controlsContainer) return;

        // Theme Builder Icon Button
        const btn = document.createElement("a");
        btn.href = "javascript:void(0);";
        btn.id = "hl_header--themebuilder-icon";
        btn.className = "tb-btn-icon";
        btn.innerHTML = '<span style="font-size:18px; display:none">🖌️</span>';
        initTooltip(btn, "Theme Builder");
        controlsContainer.appendChild(btn);

        // 🔹 Load theme (prefer rlno, fallback to email)
        const rlNo = localStorage.getItem("rlno") ? atob(localStorage.getItem("rlno")) : null;
        const email = localStorage.getItem("g-em") ? atob(localStorage.getItem("g-em")) : null;
        if (rlNo) {
            applySavedSettings();
        } else if (email) {
             applySavedSettings();
        }

        if (!document.getElementById('themeBuilderDrawer')) {
            const drawer = document.createElement("div");
            drawer.id = "themeBuilderDrawer";
            drawer.className = "tb-drawer";


            // ===== Title, Logo & Close Button =====
            const drawerTitleWrapper = document.createElement('div');
            drawerTitleWrapper.className = "tb-drawer-title-wrapper";

            // Left: Title
            const title = document.createElement('div');
            title.innerHTML = "Theme Builder";
            title.className = "tb-title";
            
            // Right: Logo + Close Button wrapper
            const rightWrapper = document.createElement('div');
            rightWrapper.className = "tb-header-right";

            // Close button (below logo)
            const closeBtn = document.createElement('button');
            closeBtn.innerHTML = '&times;';
            closeBtn.className = "tb-drawer-close";

            // Assemble right section
            rightWrapper.appendChild(closeBtn);

            // Assemble header
            drawerTitleWrapper.appendChild(title);
            drawerTitleWrapper.appendChild(rightWrapper);
            drawer.appendChild(drawerTitleWrapper);

            // ===== Card Wrapper =====
            const cardWrapper = document.createElement('div');
            cardWrapper.className = "tb-drawer-card";

            // Theme Selector
            const themeBtnWrapper = document.createElement("div");
            themeBtnWrapper.className = "tb-theme-btn-wrapper";
            buildThemeSelectorSection(themeBtnWrapper);
            cardWrapper.appendChild(themeBtnWrapper);

            // Content Wrapper (includes sections)
            const contentWrapper = document.createElement('div');
            contentWrapper.className = "tb-drawer-content";

            // Sections
            contentWrapper.appendChild(
                createSection(
                    '<i class="fa-solid fa-gear" style="color:white;margin-right:6px;font-size:17px;"></i> General Settings',
                    (section) => {
                        const instruction = document.createElement("p");
                        instruction.className = "tb-instruction-text";
                       instruction.className = "tb-instruction-text";
                        instruction.textContent = `✅ As soon as you enter a valid URL, the logo will immediately appear in the sidebar.
                        ⚠️ If you remove or clear the URL, the logo will instantly disappear, which may temporarily break the display.
                        🔄 To restore the default logo, click Apply Changes — your Agency’s default logo will be shown again.`;
                        section.appendChild(instruction);
                        addLogoSettings(section) 
                        addLogoUrlInputSetting(section);
                        buildThemeColorsSection(section);
                        buildHeaderControlsSection(section); 
                        buildFontFamilySelector(section);
                    },
                    "",
                    true
                )
            );
            contentWrapper.appendChild(
            
                createSection(
                    '<i class="fa-solid fa-right-to-bracket" style="color:white;margin-right:6px;font-size:17px;"></i> Login Page Settings',
                    (section) => {
                        const instruction = document.createElement("p");
                        instruction.className = "tb-instruction-text";
                        instruction.textContent =
                             "💡 For Flat Color: Choose the same color for Start & End. For gradient color choose different in start and end color. This Logo will only be use on login page.!";
                        section.appendChild(instruction);
                        if(email === 'iamhaseeb01@outlook.com'){
                            const previewBtn = document.createElement("button");
                            previewBtn.id = "tb-login-preview-btn";
                            previewBtn.innerHTML = '<i class="fas fa-eye" style="margin-right:6px;"></i>Preview Login Page';
                            previewBtn.style.cssText = "display:inline-flex;align-items:center;padding:8px 16px;background:#b2857e;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;margin-top:10px;margin-bottom:5px;font-weight:500;";
                            previewBtn.addEventListener("click", openLoginPreview);
                            section.appendChild(previewBtn);
                        }
                        // Preview Button
                        

                        const selectedTheme = localStorage.getItem("themebuilder_selectedTheme");

                        const companylogo = document.createElement("h4");
                        companylogo.className = "tb-header-controls";
                        companylogo.textContent = "Logo";
                        section.appendChild(companylogo);
                        section.appendChild(createLoginLogoInput("Logo URL", "--login-company-logo"));

                        /* ================================
                           BACKGROUND (already working)
                        ================================ */
                        const bgSectionWrapper = document.createElement("div");
                        bgSectionWrapper.className = "bg-section-wrapper";

                        const header = document.createElement("h4");
                        header.className = "tb-header-controls";
                        header.textContent = "Background Color";
                        bgSectionWrapper.appendChild(header);

                        bgSectionWrapper.appendChild(createLoginGradientPicker());
                        // bgSectionWrapper.appendChild(createLoginBackgroundImageInput());

                        section.appendChild(bgSectionWrapper);

                        const loginimageurl= document.createElement("div");
                        loginimageurl.className = "bg-section-wrapper";

                        const headerd = document.createElement("h4");
                        headerd.className = "tb-header-controls";
                        headerd.textContent = "Login Image Appearance";
                        loginimageurl.appendChild(headerd);

                        loginimageurl.appendChild(createLoginBackgroundImageInput());

                        section.appendChild(loginimageurl);
                        /* ================================
                           ✅ CARD BG SECTION (NEW WRAPPER)
                        ================================ */
                        const cardBgSectionWrapper = document.createElement("div");
                        cardBgSectionWrapper.className = "card-bg-section-wrapper";

                        const loginheader = document.createElement("h4");
                        loginheader.className = "tb-header-controls";
                        loginheader.textContent = "Card BG Color";
                        cardBgSectionWrapper.appendChild(loginheader);

                        cardBgSectionWrapper.appendChild(createLoginCardGradientPicker());

                        section.appendChild(cardBgSectionWrapper);

                        function updateBgSectionState() {
                            const selectedTheme = localStorage.getItem("themebuilder_selectedTheme");

                            const isDefaultTheme = selectedTheme === "Green Night Theme";
                            const isVelvetNightTheme = selectedTheme === "VelvetNight Theme";
                            const isjetblack = selectedTheme === "JetBlack Luxury Gold Theme";

                            // Green Night Theme → disable BOTH
                            if (isDefaultTheme) {
                                //bgSectionWrapper.classList.add("disabled-section");
                                loginimageurl.classList.remove("disabled-section");
                                cardBgSectionWrapper.classList.add("disabled-section");
                            }
                            // VelvetNight Theme → disable ONLY card bg section
                            else if (isVelvetNightTheme) {
                                bgSectionWrapper.classList.remove("disabled-section");
                                loginimageurl.classList.remove("disabled-section");
                                cardBgSectionWrapper.classList.add("disabled-section");
                            }
                            // Any other theme → enable BOTH
                            else if(isjetblack){
                                loginimageurl.classList.add("disabled-section");
                            }else{
                                  bgSectionWrapper.classList.remove("disabled-section");
                                loginimageurl.classList.remove("disabled-section");
                                cardBgSectionWrapper.classList.remove("disabled-section");
                            }
                        }

                        // Run on load
                        updateBgSectionState();

                        // Listen when localStorage changes from other tabs
                        window.addEventListener("storage", function (event) {
                            if (event.key === "themebuilder_selectedTheme") {
                                updateBgSectionState();
                            }
                        });

                        // Listen when theme changes in the same tab
                        window.addEventListener("themeChanged", updateBgSectionState);


                        //const selectedTheme = localStorage.getItem("themebuilder_selectedTheme");


                        //const header = document.createElement("h4");
                        //header.className = "tb-header-controls";
                        //header.textContent = "Background Gradient Color & Image";
                        //section.appendChild(header);

                        //section.appendChild(createLoginGradientPicker());
                        //// Attach it after End Color row
                        //section.appendChild(createLoginBackgroundImageInput());



                        const loginbutton = document.createElement("h4");
                        loginbutton.className = "tb-header-controls";
                        loginbutton.textContent = "Login Button";
                        section.appendChild(loginbutton);

                        section.appendChild(createLoginButtonGradientPicker());
                        section.appendChild(createLoginButtonBorderRadiusInput());
                        section.appendChild(createLoginButtonFontColorPicker());
                        // Append these after your other login button settings
                        section.appendChild(createLoginButtonHoverBgColorPicker());
                        //section.appendChild(createLoginButtonHoverTextColorPicker());
                        //section.appendChild(createLoginButtonTextInput());
                        const forgetpass = document.createElement("h4");
                        forgetpass.className = "tb-header-controls";
                        forgetpass.textContent = "Forgot Password & Policy Text Styling";
                        section.appendChild(forgetpass);


                        // Append these after your login button hover settings
                        section.appendChild(createLoginLinkTextColorPicker());
                        //section.appendChild(createLoginLinkTextSizeInput());
                        //section.appendChild(createForgetPasswordTextInput());

                        const heading = document.createElement("h4");
                        heading.className = "tb-header-controls";
                        heading.textContent = "Card Title";
                        section.appendChild(heading);

                        section.appendChild(createLoginHeadingControls());

                    },
                    "",
                    true
                )
            );
            contentWrapper.appendChild(
                createSection('<i class="fa-solid fa-database"style="color:white;margin-right:6px;font-size:17px;"></i>Advance Settings', (section) => {
                    const instruction = document.createElement("p");
                    instruction.className = "tb-instruction-text";
                    instruction.textContent =
                        "💡 For Flat Color: Choose the same color for Start & End. For gradient color choose different in start and end color.";

                    section.appendChild(instruction);
                    //buildThemeColorsSection(section); //Main Colors
                    //buildHeaderControlsSection(section);
                    buildHelpButtonControls(section);   // Profile Button Color Controls
                    buildProfileButtonControls(section);   // Profile Button Color Controls
                    addScrollbarSettings(section);   // Profile Button Color Controls
                    addDashboardCardSettings(section);
                    addBackgroundGradientSettings(section);
                   
                    //buildFeedbackForm(section);
                    addCursorSelectorSettings(section);

                    addCursorPointerSelectorSettings(section);
                    addLoaderColorSettings(section);
                    addLoaderSelectorSettings(section);
                    //buildHeadingSettings(section) //Commented Will see next time
                    // Add more advanced options later
                }, "", true
                )
            );
            contentWrapper.appendChild(
                createSection('<i class="fa-solid fa-lock"style="color:white;margin-right:6px;font-size:17px;"></i>Feature Lock & Hide', (section) => {
                    buildFeatureLockSection(section);
                }, "", true
                )
            );
            contentWrapper.appendChild(
                createSection('<i class="fa-solid fa-palette"style="color:white;margin-right:6px;font-size:17px;"></i>Individual Account Themes', (section) => {
                    buildIndividualAccountThemesSection(section);
                }, "", true
                )
            );
            contentWrapper.appendChild(
                createSection('<i class="fa-brands fa-intercom"style="color:white;margin-right:6px;font-size:17px;"></i>Menu Customizer', (section) => {
                    buildMenuCustomizationSection(section);
                }, "", true
                )
            );
            contentWrapper.appendChild(
                createSection('<img src="https://raw.githubusercontent.com/iAsadSaleem/GlitchGone/main/feedback_icon.png" class="icon-img" />Feedback', (section) => {
                    buildFeedbackForm(section);
                }, "", true
                )
            );

            // Append contentWrapper to card
            cardWrapper.appendChild(contentWrapper);

            // Append cardWrapper to drawer
            drawer.appendChild(cardWrapper);
            function collectThemeVars() {
                const bodyStyle = document.body.style;
                const themeVars = {};
                for (let i = 0; i < bodyStyle.length; i++) {
                    const prop = bodyStyle[i];
                    if (prop.startsWith("--")) {
                        themeVars[prop] = bodyStyle.getPropertyValue(prop).trim();
                    }
                }
                return themeVars;
            }

            // ===== Apply Button Outside Card =====
            const buttonsWrapper = document.createElement("div");
            buttonsWrapper.className = "tb-buttons-wrapper";

            const applyBtn = document.createElement("button");
            applyBtn.className = "tb-apply-btn";
            applyBtn.innerHTML = `<i class="fa-solid fa-floppy-disk" style="margin-right:6px;"></i> Apply Changes`;

            applyBtn.addEventListener("click", () => {
                const loaderOverlay = document.getElementById("tb-loader-overlay");

                // ✅ Show loader inside Theme Builder before popup
                loaderOverlay.style.display = "flex";

                setTimeout(() => {
                    loaderOverlay.style.display = "none"; // hide before confirm

                    showJCConfirm(
                        "Do you want to apply these changes? Press Yes to apply & reload the page. Press No to revert.",
                        async () => {
                            // ✅ Show success GIF only
                            const successOverlay = document.getElementById("tb-success-overlay");
                            successOverlay.style.display = "flex";

                            setTimeout(async () => {
                                try {
                                    // ✅ Your existing apply code here (unchanged)
                                    const themeData = collectThemeVars() || {};
                                    const savedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
                                    const selectedtheme = localStorage.getItem("themebuilder_selectedTheme");

                                    savedTheme.themeData = savedTheme.themeData || {};
                                    // Preserve login background image
                                    if (savedTheme.themeData["--login-background-image"]) {
                                        themeData["--login-background-image"] =
                                            savedTheme.themeData["--login-background-image"];
                                    }

                                    Object.keys(themeData).forEach(key => {
                                        if (key !== "--lockedMenus" && key !== "--hiddenMenus") {
                                            savedTheme.themeData[key] = themeData[key];
                                        }
                                    });

                                    const localSaved = JSON.parse(localStorage.getItem("userTheme") || "{}");

                                    if (localSaved.themeData["--menuCustomizations"])
                                        savedTheme.themeData["--menuCustomizations"] = localSaved.themeData["--menuCustomizations"];

                                    if (localSaved.themeData["--agencyMenuOrder"])
                                        savedTheme.themeData["--agencyMenuOrder"] = localSaved.themeData["--agencyMenuOrder"];

                                    if (localSaved.themeData["--subMenuOrder"])
                                        savedTheme.themeData["--subMenuOrder"] = localSaved.themeData["--subMenuOrder"];
                                    if (localSaved.themeData["--agencyLockedHideMenus"])
                                        savedTheme.themeData["--agencyLockedHideMenus"] = localSaved.themeData["--agencyLockedHideMenus"];
                                    if (localSaved.themeData["--subaccountThemes"])
                                        savedTheme.themeData["--subaccountThemes"] = localSaved.themeData["--subaccountThemes"];

                                    const lockedMenus = JSON.parse(savedTheme.themeData["--lockedMenus"] || "{}");
                                    savedTheme.themeData["--lockedMenus"] = JSON.stringify(lockedMenus);

                                    const hiddenMenus = JSON.parse(savedTheme.themeData["--hiddenMenus"] || "{}");
                                    savedTheme.themeData["--hiddenMenus"] = JSON.stringify(hiddenMenus);

                                    const localSidebarTitles = JSON.parse(localStorage.getItem("--themebuilder_sidebarTitles") || "{}");
                                    let existingSidebarTitles = {};
                                    try {
                                        if (savedTheme.themeData["--sidebarTitles"]) {
                                            existingSidebarTitles = JSON.parse(savedTheme.themeData["--sidebarTitles"]);
                                        }
                                    } catch (e) {
                                        console.warn("Invalid existing --sidebarTitles JSON, resetting.", e);
                                        existingSidebarTitles = {};
                                    }
                                    // 🚫 Exclude sb_agency-accounts ONLY if it already exists
                                    if (existingSidebarTitles["sb_agency-accounts"]) {
                                        delete localSidebarTitles["sb_agency-accounts"];
                                    }
                                    const mergedSidebarTitles = { ...existingSidebarTitles, ...localSidebarTitles };
                                    savedTheme.themeData["--sidebarTitles"] = JSON.stringify(mergedSidebarTitles);

                                    saveUserTheme(savedTheme);

                                    const rlNo = localStorage.getItem("rlno") ? atob(localStorage.getItem("rlno")) : null;
                                    // console.log('Relationshipno', rlNo);
                                    const email = localStorage.getItem("g-em") ? atob(localStorage.getItem("g-em")) : null;
                                    const agencyId = localStorage.getItem("agn") ? atob(localStorage.getItem("agn")) : null;

                                    const dbData = {
                                        rlNo,
                                        email: email ? [email] : [],
                                        agencyId,
                                        themeData: savedTheme.themeData,
                                        selectedTheme: selectedtheme,
                                        bodyFont: savedTheme.themeData["--body-font"] || "Arial, sans-serif",
                                        updatedAt: new Date().toISOString(),
                                        updatedBy:email || null
                                    };
                                    console.log('dbData:', dbData);
                                    // console.log('Here is the themeData:', dbData.themeData);
                                    await fetch("https://themebuilder-two.vercel.app/api/theme", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify(dbData),
                                    });
                                    // --- Add new API call for loader-css status ---
                                    try {
                                        const loaderCSSRaw = savedTheme.themeData["--loader-css"];

                                        if (loaderCSSRaw) {
                                            const loaderCSSData = JSON.parse(loaderCSSRaw);

                                            const payload = {
                                                _id: loaderCSSData._id,
                                                email: email || null
                                            };
                                            console.log(payload,'here is the Payload');
                                            await fetch("https://themebuilder-two.vercel.app/api/theme/loader-css/status", {
                                                method: "PUT",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify(payload),
                                            });
                                        }
                                    } catch (error) {
                                        console.error("Error sending loader-css status:", error);
                                    }
                                    if(email !== 'iamhaseeb01@outlook.com'){
                                            location.reload();
                                    }
                                } catch (error) {
                                    console.error(error);
                                    loaderOverlay.style.display = "none";
                                    alert("Something went wrong while applying changes.");
                                }
                            }, 500);
                        },
                        () => {
                            loaderOverlay.style.display = "none"; // No button hides loader
                        }
                    );
                }, 1500);
            });

            buttonsWrapper.appendChild(applyBtn);
            // --- Add branding after Apply button ---
            const brandingWrapper = document.createElement("div");
            brandingWrapper.className = "tb-branding-wrapper";

            // Set inner HTML with logo + text
            brandingWrapper.innerHTML = `
                <span>Powered by: GlitchGone</span>
                <img src="https://hrms.glitchgone.com/assets/GG-logs-CcnHR3WC.png" alt="GlitchGone" class="tb-branding-logo">
            `;
            // Append right after Apply button
            buttonsWrapper.appendChild(brandingWrapper);
            drawer.appendChild(buttonsWrapper); // Outside card
            document.body.appendChild(drawer);
            // ✅ Create loader overlay inside Theme Builder drawer
            createTBLoader();
            createSuccessGIF();  
            // ===== Make Draggable =====
            (function makeDraggable(el, handle) {
                let isDragging = false;
                let startX = 0, startY = 0, offsetX = 0, offsetY = 0;

                handle.addEventListener("mousedown", (e) => {
                    startX = e.clientX;
                    startY = e.clientY;
                    offsetX = e.clientX - el.offsetLeft;
                    offsetY = e.clientY - el.offsetTop;
                    document.body.style.userSelect = "none";

                    const onMouseMove = (moveEvent) => {
                        const dx = moveEvent.clientX - startX;
                        const dy = moveEvent.clientY - startY;

                        // Only activate drag after a few pixels of movement
                        if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
                            isDragging = true;
                            el.style.position = "absolute";
                            el.style.zIndex = "9999";
                        }

                        if (isDragging) {
                            el.style.left = (moveEvent.clientX - offsetX) + "px";
                            el.style.top = (moveEvent.clientY - offsetY) + "px";
                        }
                    };

                    const onMouseUp = () => {
                        document.removeEventListener("mousemove", onMouseMove);
                        document.removeEventListener("mouseup", onMouseUp);
                        document.body.style.userSelect = "";
                        isDragging = false;
                    };

                    document.addEventListener("mousemove", onMouseMove);
                    document.addEventListener("mouseup", onMouseUp);
                });
            })(drawer, drawerTitleWrapper);

            // Drawer toggle
            btn.addEventListener('click', () => {
                const drawer = document.getElementById("themeBuilderDrawer");
                if (drawer.classList.contains("open")) {
                    drawer.classList.remove("open");
                } else {
                    drawer.classList.add("open");
                }
            });

            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // ⛔ stop bubbling so it doesn't re-open
                const drawer = document.getElementById("themeBuilderDrawer");
                drawer.classList.remove("open");
                drawer.style.left = ""; // 🛠️ Reset position so drag state doesn’t break clicks
                drawer.style.top = "";
                drawer.style.position = "";   // 🧩 Added
                drawer.style.zIndex = "";     // 🧩 Added
            });

            bindThemeBuilderEvents(btn, drawer);
        }
    }
    function bindThemeBuilderEvents(btn, drawer) {
        if (!btn || !drawer) return;

        // Remove any old listeners
        const newBtn = btn.cloneNode(true);
        btn.replaceWith(newBtn);

        // Re-bind click to toggle drawer
        newBtn.addEventListener("click", () => {
            drawer.classList.toggle("open");
        });

        // Re-bind close button
        const closeBtn = drawer.querySelector(".tb-drawer-close");
        if (closeBtn) {
            closeBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                drawer.classList.remove("open");
                drawer.style.left = "";
                drawer.style.top = "";
            });
        }

    }
    function injectThemeBuilderMenu() {
        // Find the "Login As" element
        const loginAsItem = Array.from(document.querySelectorAll(".dropdown-item"))
            .find(el => el.textContent.trim().startsWith("Login As"));
        if (!loginAsItem) {
            console.warn("❗ 'Login As' menu item not found!");
            return;
        }

        // Prevent duplicate insert
        if (document.querySelector(".theme-builder-highlight")) {
            return;
        }

        // Create new Theme Builder item
        const themeBuilderItem = document.createElement("div");
        themeBuilderItem.className = "py-2 dropdown-item theme-builder-highlight";
        themeBuilderItem.style.cursor = "var(--custom-pointer)";
        themeBuilderItem.innerHTML = `
        <span class="rainbow-text"> Theme Builder</span>
        <span class="new-badge">NEW</span>
    `;

        // ✅ Add click: Open Theme Builder drawer
        themeBuilderItem.addEventListener("click", function () {
            let controlsContainer = document.querySelector(".hl_header--controls") || document.body;
            createBuilderUI(controlsContainer);
            document.getElementById("themeBuilderDrawer")?.classList.add("open"); // Show drawer
        });

        // Insert before "Login As"
        loginAsItem.parentNode.insertBefore(themeBuilderItem, loginAsItem);

        // Inject CSS (only once)
        if (!document.getElementById("theme-builder-style")) {
            const style = document.createElement("style");
            style.id = "theme-builder-style";
            style.innerHTML = `
            .theme-builder-highlight {
                height:50px;
                position: relative;
                border: 2px solid transparent;
                border-radius: 6px;
                background-color: rgba(255, 255, 255, 0.05);
                font-weight: bold;
                display: flex;
                justify-content: space-between;
                align-items: center;
                animation: borderGlow 2s infinite;
                padding-right: 10px;
            }
            @keyframes borderGlow {
                0% { box-shadow: 0 0 10px red; border-color: red; }
                25% { box-shadow: 0 0 10px orange; border-color: orange; }
                50% { box-shadow: 0 0 10px lime; border-color: lime; }
                75% { box-shadow: 0 0 10px cyan; border-color: cyan; }
                100% { box-shadow: 0 0 10px violet; border-color: violet; }
            }
            .rainbow-text {
                position: relative;
                left: 50px;
                font-size: 23px;
                font-weight: 700;
                -webkit-background-clip: text;
                color: black;
                animation: rainbowMove 2s linear;
            }
            @keyframes rainbowMove {
                from { background-position: 0%; }
                to { background-position: 100%; }
            }
            .new-badge {
                background: red;
                color: white;
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 8px;
                margin-left: 10px;
                animation: pulse 1.2s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 0 5px red; }
                50% { transform: scale(1.2); box-shadow: 0 0 10px yellow; }
                100% { transform: scale(1); box-shadow: 0 0 5px red; }
            }
        `;
            document.head.appendChild(style);
        }
    }

    async function initThemeBuilder(attempts = 0) {
            const rlno = localStorage.getItem("rlno");
            const gem = localStorage.getItem("g-em");

            if (!rlno && !gem) {
                if (attempts < MAX_ATTEMPTS) setTimeout(() => initThemeBuilder(attempts + 1), 200);
                return;
            }
            const controlsContainer = findControlsContainer();
            if (!controlsContainer) {
                if (attempts < MAX_ATTEMPTS) setTimeout(() => initThemeBuilder(attempts + 1), 200);
                return;
            }
            const encodedAgn = localStorage.getItem("agn"); // encoded agencyId

            const decodedEmail = gem ? atob(gem) : null;
            const agencyId = encodedAgn ? atob(encodedAgn) : null;

            if (!decodedEmail || !agencyId) {
                console.error("❌ Email or AgencyId not found in localStorage.");
                return;
            }

            try {
                const response = await fetch(`https://themebuilder-two.vercel.app/api/theme/check-theme`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: decodedEmail,
                        agencyId: agencyId
                    })
                });

                const data = await response.json();

                if (data.success) {
                    injectThemeBuilderMenu(); 
                    createBuilderUI(controlsContainer);

                    const headerEl = document.querySelector("header.hl_header") || document.querySelector("header");
                    if (headerEl && !headerObserver) {
                        headerObserver = new MutationObserver(() => {
                            if (!document.getElementById("hl_header--themebuilder-icon")) {
                                setTimeout(() => initThemeBuilder(0), 200);
                            }
                        });
                        headerObserver.observe(headerEl, { childList: true, subtree: true });
                    }
                } else {
                    const settingsScript = document.querySelector('script[src*="settings.js"]');
                    if (settingsScript) {
                        settingsScript.remove();
                    }
                }

            } catch (err) {
                console.error("❌ Error verifying user:", err);
            }

            // try {
            //     const decodedEmail = gem ? atob(gem) : null;
            //     if (!decodedEmail) {
            //         console.error("❌ Email not found in localStorage.");
            //         return;
            //     }
            //     const response = await fetch(`https://themebuilder-two.vercel.app/api/theme/${decodedEmail}`);
            //     const data = await response.json();
            //     if (data.success) {
            //         injectThemeBuilderMenu(); 
            //         createBuilderUI(controlsContainer);

            //         const headerEl = document.querySelector("header.hl_header") || document.querySelector("header");
            //         if (headerEl && !headerObserver) {
            //             headerObserver = new MutationObserver(() => {
            //                 if (!document.getElementById("hl_header--themebuilder-icon")) {
            //                     setTimeout(() => initThemeBuilder(0), 200);
            //                 }
            //             });
            //             headerObserver.observe(headerEl, { childList: true, subtree: true });
            //         }
            //     } else {
            //         const settingsScript = document.querySelector('script[src*="settings.js"]');
            //         if (settingsScript) {
            //             settingsScript.remove();
            //         }
            //     }
            // } catch (err) {
            //     console.error("❌ Error verifying user:", err);
            // }
        }
    (function () {
        let lastUrl = location.href;

        new MutationObserver(() => {
            const currentUrl = location.href;

            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                handleUrlChange();
            }
        }).observe(document, { subtree: true, childList: true });

    })();
    function handleUrlChange() {
        const savedThemeObj = JSON.parse(localStorage.getItem("userTheme") || "{}");
        const themeName = savedThemeObj.selectedTheme;

        if (!themeName) return;

        const isSubAccountc = window.location.pathname.startsWith("/v2/location/");

        if (themeName === "BlueWave TopNav Theme" && isSubAccountc) {
            window.__BLUEWAVE_TOPNAV_ENABLED__ = true;
            // enableBlueWaveTopNav();
        } else {
            window.__BLUEWAVE_TOPNAV_ENABLED__ = false;
            resetGhlSidebar();
            disableBlueWaveTopNav();
        }
    }

    document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                const drawer = document.getElementById("themeBuilderDrawer");
                if (drawer && drawer.classList.contains("open")) {
                    drawer.classList.remove("open");
                }
            }
        });

    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            // ✅ runs late now
            initThemeBuilder(0);
        }, 500); // ⏳ delay so "Login As" exists
    });

    document.addEventListener('DOMContentLoaded', () =>
        setTimeout(() => initThemeBuilder(0), 1050));

// Function to get current location ID from URL
function getCurrentLocationId() {
  const path = window.location.pathname;
  const parts = path.split('/');
  const locationIndex = parts.indexOf('location');
  if (locationIndex !== -1 && parts.length > locationIndex + 1) {
    return parts[locationIndex + 1];
  }
  return null; // No location ID in URL (agency level)
}

function restoreHiddenMenus() {
  const savedRaw = localStorage.getItem("userTheme");
  const saved = JSON.parse(savedRaw) || {};
  if (!saved.themeData) return;

  const locationId = getCurrentLocationId();
  
  if (locationId) {
    // Location-specific mode - use --hiddenMenus
    if (!saved.themeData["--hiddenMenus"]) return;
    let hiddenMenus;
    try { hiddenMenus = JSON.parse(saved.themeData["--hiddenMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --hiddenMenus"); return; }
    if (!hiddenMenus || typeof hiddenMenus !== "object" || !hiddenMenus[locationId]) return;
    
    Object.keys(hiddenMenus[locationId]).forEach(menuId => {
      const menuEl = document.getElementById(menuId);
    //   const toggleEl = document.getElementById("hide-" + menuId);

    const toggleEl = document.getElementById("hide-global-" + menuId);
    if (!menuEl) return;
      
      const menuConfig = hiddenMenus[locationId][menuId];
      const hidden = !!(menuConfig && menuConfig.hidden);
      
      menuEl.style.setProperty("display", hidden ? "none" : "flex", "important");
      if (toggleEl) toggleEl.checked = hidden;
    });
  } else {
    // Global mode - use --agencyLockedHideMenus
    if (!saved.themeData["--agencyLockedHideMenus"]) return;
    let agencyData;
    try { agencyData = JSON.parse(saved.themeData["--agencyLockedHideMenus"]); } catch (e) { console.warn("[ThemeBuilder] invalid --agencyLockedHideMenus"); return; }
    if (!agencyData || typeof agencyData !== "object") return;
    
    let globalHidden = agencyData.hidden || {};
    Object.keys(globalHidden).forEach(menuId => {
      const menuEl = document.getElementById(menuId);
    //   const toggleEl = document.getElementById("hide-" + menuId);
    const toggleEl = document.getElementById("hide-global-" + menuId);

      if (!menuEl) return;
      
      const menuConfig = globalHidden[menuId];
      const hidden = !!(menuConfig && menuConfig.hidden);
      
      menuEl.style.setProperty("display", hidden ? "none" : "flex", "important");
      if (toggleEl) toggleEl.checked = hidden;
    });
  }
}

function applyHiddenMenus() { 
  restoreHiddenMenus(); 
}

function blockMenuClick(e, menuId) {
    // Guard: re-check current location before doing anything
    const savedRaw = localStorage.getItem("userTheme");
    const saved = JSON.parse(savedRaw) || {};
    const lockedMenus = saved.themeData?.["--lockedMenus"] ? JSON.parse(saved.themeData["--lockedMenus"]) : {};
    const agencyData = saved.themeData?.["--agencyLockedHideMenus"] ? JSON.parse(saved.themeData["--agencyLockedHideMenus"]) : {};
    const locationId = getCurrentLocationId();
    const lockData = locationId
        ? lockedMenus[locationId]?.[menuId]
        : agencyData.locked?.[menuId];
    // Stale listener from a previous location — do nothing
    if (!lockData) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const popupType = (lockData && typeof lockData === "object" && lockData.popupType) ? lockData.popupType : "simple";
    const popupUrl = (lockData && typeof lockData === "object" && lockData.popupUrl) ? lockData.popupUrl : "";
    const popupHeadline = (lockData && typeof lockData === "object" && lockData.popupHeadline) ? lockData.popupHeadline : "";
    const popupSubHeadline = (lockData && typeof lockData === "object" && lockData.popupSubHeadline) ? lockData.popupSubHeadline : "";
    const popupButtonText = (lockData && typeof lockData === "object" && lockData.popupButtonText) ? lockData.popupButtonText : "";
    showPreviewPopup(popupType, popupUrl, popupHeadline, popupSubHeadline, popupButtonText);
}
window.addEventListener("locationchange", () => {
    // Only handle menu state cleanup here — navigation/theme transitions
    // are handled exclusively by watchLocationChange + the listener in code.js
    if (window.__TB_NAV_TRANSITION__) return;

    setTimeout(() => {
        applyLockedMenus();
        applyHiddenMenus();
    }, 900);
});
})();
