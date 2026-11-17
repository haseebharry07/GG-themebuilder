
// ThemeBuilder - safer, namespaced, production-ready
(function () {
  const NS = "themebuilder"; // namespace prefix for storage & IDs
  const STORAGE = {
    themeCSS: `${NS}_themeCSS`,
    userTheme: `userTheme`,
    selectedTheme: `${NS}_selectedTheme`,
    agn: `agn`
  };
 
  try { localStorage.setItem(STORAGE.agn, agn); } catch (e) { /* ignore storage failures */ }

  // ---- Utilities ----
  function log(...args) { /*toggle console debug here*/ console.debug("[ThemeBuilder]", ...args); }
  function safeJsonParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  // ---- Fetch/apply remote CSS JSON ----
  async function applyCSSFile() {

    const url = (() => {
      try { return decodeBase64Utf8(remoteEncoded || remoteEncoded === undefined ? remoteEncoded : remoteEncoded); } catch (e) { return atob(remoteEncoded); }
    })();

    // fallback: try decode remoteEncoded directly
    let decodedUrl;
    try { decodedUrl = decodeBase64Utf8(remoteEncoded); } catch (_) { decodedUrl = null; }
    const finalUrl = decodedUrl || (function () { try { return atob(remoteEncoded); } catch (e) { return null; } })();
    if (!finalUrl) {
      console.error("[ThemeBuilder] invalid remote URL");
      return;
    }

    const cachedCSS = localStorage.getItem(STORAGE.themeCSS);
    if (cachedCSS) {
      const text = decodeBase64Utf8(cachedCSS);
      if (text) injectCSS(text);
    }

    // Apply favicon immediately from localStorage to prevent flash on refresh
    const cachedTheme = JSON.parse(localStorage.getItem("userTheme") || "{}");
    const cachedThemeData = cachedTheme.themeData || {};
    if (cachedThemeData["--custom-logo-url"]) {
        changeFavicon(cachedThemeData["--custom-logo-url"]);
    } else {
        changeFavicon('');
    }
    // Then your existing fetch below...
    try {
        const res = await fetch(finalUrl, { cache: "no-cache" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const css = json.css || "";
        const themeData = json.themeData || {};
        const selectedtheme = json.selectedTheme || "";
        if (themeData && themeData["--custom-logo-url"]) {
            changeFavicon(themeData["--custom-logo-url"]);
        } else {
            changeFavicon('');
        }

      const cssText = decodeBase64Utf8(css);
      try { localStorage.setItem(STORAGE.themeCSS, css); } catch (e) { /* ignore storage quota */ }
      try { localStorage.setItem(STORAGE.selectedTheme, selectedtheme); } catch (e) { /* ignore */ }
      if (!cachedCSS && cssText) injectCSS(cssText);

      // merge theme data safely
      const savedRaw = localStorage.getItem(STORAGE.userTheme);
      const saved = safeJsonParse(savedRaw) || {};
      // const merged = { ...(saved.themeData || {}), ...themeData };
      // injectThemeData(merged);
      const merged = { ...(saved.themeData || {}), ...themeData };
      // 🔒 Never let the remote agency JSON wipe the locally-owned subaccount map
      if (saved.themeData?.["--subaccountThemes"]) {
          merged["--subaccountThemes"] = saved.themeData["--subaccountThemes"];
      }
      injectThemeData(merged);
      applySidebarLogoFromTheme();

      // restore UI changes
      restoreHiddenMenus();
      applyHiddenMenus();
     
      // After: const json = await res.json();
      const loaderCSSEncoded = json.loaderCSS || "";
      const loaderCSSText = loaderCSSEncoded ? decodeBase64Utf8(loaderCSSEncoded) : "";
      // Cache the full loader CSS string
      if (typeof window.__updateLoaderCache === 'function') {
        window.__updateLoaderCache({
          logoUrl: themeData["--loader-company-url"] || "",
          animationType: themeData["--animation-settings"] || "PulsatingLogo",
          bgColor: themeData["--loader-bg-color"] || "",
          fullCSS: loaderCSSText  // ← store the full CSS
        });
      }
      if (typeof window.__themeReady === 'function') window.__themeReady();
      log("Theme applied from remote");
       applySubaccountTheme();
      setTimeout(() => applySubaccountTheme(), 200);
      setTimeout(() => applySubaccountTheme(), 800);
    } catch (err) {
      console.error("[ThemeBuilder] Failed to fetch theme:", err);
      if (typeof window.__themeReady === 'function') window.__themeReady(); // unblock loader even on error
    }
  }
/**
 * Update Sidebar Logo from CSS Variable
 * Reads: --agency-logo-url (raw URL)
 * Fallback: --agency-logo (url("..."))
 */
function applySidebarLogoFromTheme(retries = 15, delay = 300) {
    const savedRaw = localStorage.getItem(STORAGE.userTheme);
    const saved = safeJsonParse(savedRaw) || {};
    try {
        // If we're on a subaccount page that has a configured logo override,
        // skip entirely — applySubaccountTheme() handles the logo for this location.
        const locationId = getCurrentLocationId();
        if (locationId) {
            const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
            const subaccountThemes = saved.themeData?.["--subaccountThemes"]
                ? JSON.parse(saved.themeData["--subaccountThemes"])
                : {};
            if (subaccountThemes[locationId]?.logoUrl) {
                return; // Let applySubaccountTheme handle the logo — do not overwrite it
            }
        }

        const root = document.documentElement;
        const img = document.querySelector(".agency-logo");
        if (!img) {
            if (retries > 0) {
                setTimeout(() => applySidebarLogoFromTheme(retries - 1, delay), delay);
            } else {
                console.warn("[ThemeBuilder] .agency-logo not found after retries.");
            }
            return;
        }
        let url = getComputedStyle(root)
            .getPropertyValue("--agency-logo-url")
            .trim()
            .replace(/^"|"$/g, "");
        if (!url) {
            let cssUrl = getComputedStyle(root)
                .getPropertyValue("--agency-logo")
                .trim()
                .replace(/^"|"$/g, "");
            const match = cssUrl.match(/url\(['"]?(.*?)['"]?\)/);
            if (match) url = match[1];
        }
        if (!url) return;
        img.src = url;
        img.style.objectFit = "contain";
        const w = getComputedStyle(root).getPropertyValue("--logo-width").trim();
        const h = getComputedStyle(root).getPropertyValue("--logo-height").trim();
        if (w) img.style.width = w;
        if (h) img.style.height = h;
        if (typeof changeFavicon === "function") changeFavicon(saved.themeData["--custom-logo-url"]);
    } catch (e) {
        console.error("[ThemeBuilder] Failed applying sidebar logo", e);
    }
}

  function decodeBase64Utf8(base64) {
    try {
      const binary = atob(base64);
      const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
      const decoder = new TextDecoder("utf-8");
      return decoder.decode(bytes);
    } catch (e) {
      console.warn("[ThemeBuilder] decodeBase64Utf8 failed:", e);
      return "";
    }
  }

  // ---- DOM/CSS helpers ----
  function injectCSS(cssText) {
    if (!cssText) return;
    const id = `${NS}-css`;
    const old = document.getElementById(id);
    if (old) old.remove();
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = cssText;
    (document.head || document.getElementsByTagName("head")[0] || document.documentElement).appendChild(style);
    log("Injected CSS");
  }

  function changeFavicon(url) {
    if (!url) return;
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;
    const existing = head.querySelectorAll("link[rel*='icon']");
    existing.forEach(e => e.remove());
    const link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = url;
    head.appendChild(link);
    log("Favicon changed:", url);
  }
  const SUBACCOUNT_ORDER_MAP = {
              "sb_launchpad": "launchpad",
              "sb_dashboard": "dashboard",
              "sb_conversations": "conversations",
              "sb_opportunities": "opportunities",
              "sb_calendars": "calendars",
              "sb_contacts": "contacts",
              "sb_payments": "payments",
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
            function getAgencyMenusFromDOM() {
              const sidebar = document.querySelector('#sidebar-v2');
              if (!sidebar) return [];
              const menuEls = sidebar.querySelectorAll('a[id^="sb_"]');
              return Array.from(menuEls)
                  .filter(el => el.id && el.id !== "sb_")
                  .map(el => {
                      const span = el.querySelector('span:not([class*="icon"]):not([class*="dot"])');
                      const label = span?.textContent?.trim()
                          || el.id.replace(/^sb_agency-/, '').replace(/-/g, ' ')
                                  .replace(/\b\w/g, c => c.toUpperCase());
                      return { id: el.id, label };
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

 (function applySavedSubAccountOrderOnLoad() {
            if (!location.pathname.includes("/location/")) return;

            const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
            const order = saved.themeData?.["--subMenuOrder"]
                ? JSON.parse(saved.themeData["--subMenuOrder"])
                : [];

            if (!order.length) return;

            // Apply CSS order
            order.forEach((menuId, index) => {
                const cssKey = SUBACCOUNT_ORDER_MAP[menuId];
                if (!cssKey) return;

                document.documentElement.style.setProperty(
                    `--${cssKey}-order`,
                    index
                );
            });
        })();
        (function applySavedAgencyOrderOnLoad() {
    if (location.pathname.includes("/location/")) return;

    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
    const order = saved.themeData?.["--agencyMenuOrder"]
        ? JSON.parse(saved.themeData["--agencyMenuOrder"])
        : [];
    if (!order.length) return;

    // ✅ CSS stylesheet approach — invisible to GHL's React reconciliation
    // and does NOT trigger childList mutations on #sidebar-v2
    function injectAgencyOrderCSS(metaOrder) {
        const old = document.getElementById("tb-agency-menu-order-css");
        if (old) old.remove();

        let css = "";
        metaOrder.forEach((metaKey, index) => {
            css += `a[meta="${metaKey}"] { order: ${index} !important; }\n`;
        });

        // Push any new unknown GHL menus to the end
        const sidebarNav = document.querySelector('.hl_nav-header nav[aria-label="header"]');
        if (sidebarNav) {
            let endIndex = metaOrder.length;
            sidebarNav.querySelectorAll("[meta]").forEach(el => {
                const m = el.getAttribute("meta");
                if (!metaOrder.includes(m)) {
                    css += `a[meta="${m}"] { order: ${endIndex++} !important; }\n`;
                }
            });
        }

        const style = document.createElement("style");
        style.id = "tb-agency-menu-order-css";
        style.textContent = css;
        document.head.appendChild(style);
    }

    const metaOrder = order.map(id => id.replace(/^sb_/, ""));

    // Try immediately, retry until nav exists
    const tryApply = () => {
        const sidebarNav = document.querySelector('.hl_nav-header nav[aria-label="header"]');
        if (sidebarNav) {
            injectAgencyOrderCSS(metaOrder);
            return true;
        }
        return false;
    };

    if (!tryApply()) {
        const retryInterval = setInterval(() => {
            if (tryApply()) clearInterval(retryInterval);
        }, 100);
        setTimeout(() => clearInterval(retryInterval), 10000);
    }
        })();
  // // ---- Theme data injection ----
function injectThemeData(themeData) {
    if (!themeData || typeof themeData !== "object") return;

    const savedRaw = localStorage.getItem(STORAGE.userTheme);
    const saved = safeJsonParse(savedRaw) || {};
    const mergedTheme = { ...(saved.themeData || {}), ...themeData };

    // Always save the full merged data to localStorage (preserves all config keys)
    try { localStorage.setItem(STORAGE.userTheme, JSON.stringify({ themeData: mergedTheme })); } catch (e) {}

    const root = document.documentElement;
    const locationId = getCurrentLocationId();

    // ── Subaccount check ─────────────────────────────────────────────────
    if (locationId) {
        try {
            const sub = mergedTheme["--subaccountThemes"]
                ? JSON.parse(mergedTheme["--subaccountThemes"])
                : {};
            const locTheme = sub[locationId];

            if (locTheme && (locTheme.themeName || locTheme.themeData)) {
                // Resolve CSS vars: prefer cache lookup by themeName, fall back to legacy inline themeData
                let subVars = null;

                if (locTheme.themeName && window.__themesCache) {
                    subVars = window.__themesCache[locTheme.themeName] || null;
                }

                // Legacy fallback for old documents that still have inline themeData
                if (!subVars && locTheme.themeData) {
                    subVars = locTheme.themeData;
                    if (typeof subVars === "string") {
                        try { subVars = JSON.parse(subVars); } catch (e) { subVars = null; }
                    }
                }

                if (subVars && typeof subVars === "object" && Object.keys(subVars).length > 0) {
                    Object.keys(subVars).forEach(key => {
                        if (key.startsWith("--") && typeof subVars[key] === "string") {
                            try { root.style.setProperty(key, subVars[key], "important"); } catch (e) {}
                            try { document.body.style.setProperty(key, subVars[key], "important"); } catch (e) {}
                        }
                    });
                    if (locTheme.logoUrl) {
                        try { root.style.setProperty("--agency-logo-url", locTheme.logoUrl); } catch (e) {}
                    }
                    console.log(`[ThemeBuilder] Subaccount theme "${locTheme.themeName || 'inline'}" applied for: ${locationId}`);
                    return; // ← Agency vars never written
                }

                // Cache not ready yet — still SKIP agency vars, then load cache and re-apply
                if (locTheme.themeName && typeof ensureThemesCache === "function") {
                    console.log(`[ThemeBuilder] Subaccount theme "${locTheme.themeName}" pending cache for: ${locationId}`);
                    ensureThemesCache().then(() => {
                        if (typeof applySubaccountTheme === "function") applySubaccountTheme();
                    });
                    return; // ← Critical: do NOT fall through to agency theme
                }
            }
        } catch (e) {
            console.warn("[ThemeBuilder] Subaccount theme check failed:", e);
        }
    }

    // ── Agency theme (only when no subaccount override exists) ───────────
    Object.keys(mergedTheme).forEach(key => {
        if (key.startsWith("--") && typeof mergedTheme[key] === "string") {
            try { root.style.setProperty(key, mergedTheme[key]); } catch (e) {}
        }
    });
    console.log("[ThemeBuilder] Agency theme applied");
}

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

  // ---- Logo injection ----
  function restoreHiddenMenus() {
  const savedRaw = localStorage.getItem("userTheme"); // Changed from STORAGE.userTheme
  const saved = JSON.parse(savedRaw) || {}; // Changed from safeJsonParse
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
      const toggleEl = document.getElementById("hide-" + menuId);
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
      const toggleEl = document.getElementById("hide-" + menuId);
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
    function showPreviewPopup(type, popupUrl, popupHeadline, popupSubHeadline, popupButtonText) {
    document.getElementById("tb-preview-popup")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "tb-preview-popup";
    overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:200000;";

    const popup = document.createElement("div");
    popup.style.cssText = "position:relative;background:var(--sidebar-menu-bg,#1A1A1A);padding:30px;border-radius:10px;max-width:350px;width:90%;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,0.3);";

   if (type === "simple") {
        popup.innerHTML = `<h3 class="modal-title" >Access Denied</h3><p class="modal-title" >You cannot access this feature.</p>`;
    } else if (type === "upgrade") {
        const headline    = popupHeadline    || "Upgrade Required 🚀";
        const subHeadline = popupSubHeadline || "This feature is available in Premium Plan.";
        const btnText     = popupButtonText  || "Upgrade";
        popup.innerHTML = `<h3 class="modal-title">${headline}</h3><p class="modal-title" >${subHeadline}</p><button id="tb-popup-action-btn" style="margin-top:10px;padding:8px 16px;background:var(--scroll-color,#1A1A1A);color:#fff;border:none;border-radius:5px;cursor:pointer;">${btnText}</button>`;
    } else if (type === "contact") {
        const headline    = popupHeadline    || "Restricted";
        const subHeadline = popupSubHeadline || "Please contact admin to get access.";
        const btnText     = popupButtonText  || "Contact";
        popup.innerHTML = `<h3 class="modal-title">${headline}</h3><p class="modal-title" >${subHeadline}</p><button id="tb-popup-action-btn" style="margin-top:10px;padding:8px 16px;background:var(--scroll-color,#1A1A1A);color:#fff;border:none;border-radius:5px;cursor:pointer;">${btnText}</button>`;
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
function cleanupMenuStates() {
    document.querySelectorAll("a[id^='sb_'], .hl_nav-header a").forEach(menu => {
        // Remove lock icon
        const icon = menu.querySelector(".tb-lock-icon");
        if (icon) icon.remove();

        // Reset hidden styles
        menu.style.removeProperty("display");
    });
}
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
// ── Clears all inline CSS custom properties set by applySubaccountTheme ──────
function clearSubaccountTheme() {
    const root = document.documentElement;
    const body = document.body;

    // Clear :root inline custom properties
    const rootVars = [];
    for (let i = 0; i < root.style.length; i++) {
        if (root.style[i].startsWith("--")) rootVars.push(root.style[i]);
    }
    rootVars.forEach(prop => root.style.removeProperty(prop));

    // Clear document.body inline custom properties (written by injectThemeData's body path)
    const bodyVars = [];
    for (let i = 0; i < body.style.length; i++) {
        if (body.style[i].startsWith("--")) bodyVars.push(body.style[i]);
    }
    bodyVars.forEach(prop => body.style.removeProperty(prop));

    console.log("[ThemeBuilder] Subaccount theme cleared from :root and body, restoring agency theme.");
}

// ── Watches for SPA navigation between agency ↔ subaccount ───────────────────
(function watchLocationChange() {
    let lastPath = window.location.pathname;
    let navigationLock = false;

    function wasSubaccountPath(p) { return p.includes("/location/"); }

    function tick() {
    const currentPath = window.location.pathname;
    if (currentPath === lastPath) return;
    if (navigationLock) return;

    const prevPath = lastPath;
    const leftSubaccount = wasSubaccountPath(prevPath) && !wasSubaccountPath(currentPath);
    const enteredSubaccount = !wasSubaccountPath(prevPath) && wasSubaccountPath(currentPath);

    // Update lastPath immediately so rapid ticks don't re-trigger
    lastPath = currentPath;

    if (leftSubaccount) {
        window.__TB_NAV_TRANSITION__ = true;
        navigationLock = true;

        clearSubaccountTheme();

        const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
        if (saved.themeData) {
            const agencyVars = Object.fromEntries(
                Object.entries(saved.themeData).filter(([k]) =>
                    k !== "--subaccountThemes"
                )
            );
            injectThemeData(agencyVars);
        }

        setTimeout(() => {
            // Verify we are still on agency page before applying logo
            // This prevents applying agency logo if user navigated back to subaccount quickly
            if (!getCurrentLocationId()) {
                if (typeof applySidebarLogoFromTheme === "function") applySidebarLogoFromTheme();
            }
            navigationLock = false;
            window.__TB_NAV_TRANSITION__ = false;
        }, 1000);
    }

if (enteredSubaccount) {
    window.__TB_NAV_TRANSITION__ = true;
    navigationLock = true;

    let iconInjected = false;

    const sidebarWatcher = new MutationObserver(() => {
        const menus = document.querySelectorAll("#sidebar-v2 a[id^='sb_']");
        if (menus.length > 0 && !iconInjected) {
            iconInjected = true;
            sidebarWatcher.disconnect();

            const doApply = () => {
                // Use window references — applyMenuCustomizations is in a
                // different IIFE scope and not directly accessible here
                if (typeof window.__tbApplyMenuCustomizations === "function") {
                    window.__tbApplyMenuCustomizations();
                }
                if (typeof window.__tbApplyStoredSidebarTitles === "function") {
                    window.__tbApplyStoredSidebarTitles();
                }
                requestAnimationFrame(() => {
                    document.querySelectorAll(".tb-sidebar-icon").forEach(el => {
                        el.style.display = "none";
                        el.offsetHeight;
                        el.style.display = "";
                    });
                });
            };

            if (document.fonts && document.fonts.load) {
                document.fonts.load('900 16px "Font Awesome 6 Free"')
                    .then(doApply)
                    .catch(doApply);
            } else {
                doApply();
            }
        }
    });

    sidebarWatcher.observe(document.body, { childList: true, subtree: true });

    // Safety net
    setTimeout(() => {
        if (!iconInjected) {
            sidebarWatcher.disconnect();
            if (typeof window.__tbApplyMenuCustomizations === "function") {
                window.__tbApplyMenuCustomizations();
            }
            if (typeof window.__tbApplyStoredSidebarTitles === "function") {
                window.__tbApplyStoredSidebarTitles();
            }
        }
    }, 5000);

    // Unchanged
    setTimeout(() => {
        if (typeof applySubaccountTheme === "function") applySubaccountTheme();
        navigationLock = false;
        window.__TB_NAV_TRANSITION__ = false;
    }, 300);

    setTimeout(() => {
        if (typeof applySubaccountTheme === "function") applySubaccountTheme();
    }, 750);
}
}

    setInterval(tick, 300);
})();
// Call on page load
document.addEventListener('DOMContentLoaded', function() {
  applyHiddenMenus();
  applyLockedMenus();
  applySubaccountTheme();
});

setInterval(() => {
  const current = localStorage.getItem("userTheme");
  if (current !== window.lastUserTheme) {
    window.lastUserTheme = current;
    applyHiddenMenus();
    applyLockedMenus();
    // Only apply subaccount theme if we are actually on a subaccount page
    if (getCurrentLocationId()) {
      applySubaccountTheme();
    }
  }
}, 500);
  
  async function applyAgencyLogo(attempt = 1) {

    const locationId = getCurrentLocationId();
    if (locationId) {
        try {
            const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
            const sub = saved.themeData?.["--subaccountThemes"]
                ? JSON.parse(saved.themeData["--subaccountThemes"])
                : {};
            if (sub[locationId]?.logoUrl) return;
        } catch (e) {}
    }

    const savedRaw = localStorage.getItem(STORAGE.userTheme);
    const saved = safeJsonParse(savedRaw) || {};
    const themeVars = saved.themeData || {};
    let logoUrl = themeVars["--login-company-logo"] || themeVars["--custom-logo-url"];
    if (logoUrl) {
      logoUrl = logoUrl.replace(/^url\(["']?/, "").replace(/["']?\)$/, "");
    }
    const logoImg = document.querySelector(".agency-logo");
    if (logoImg && logoUrl) {
      logoImg.src = logoUrl;
      log("Applied agency logo");
      return;
    }
    if (attempt < 20) {
      await sleep(300);
      return applyAgencyLogo(attempt + 1);
    }
    log("Agency logo not found after retries");
  }
// ✅ ---- Sidebar Titles Restore ----
function applyStoredSidebarTitles() {
  try {
    const saved = JSON.parse(localStorage.getItem("userTheme") || "{}");
    if (!saved.themeData || !saved.themeData["--sidebarTitles"]) return;

    // Parse the stored sidebar title data
    const titles = JSON.parse(saved.themeData["--sidebarTitles"]);

    Object.entries(titles).forEach(([varName, newLabel]) => {
      // Extract metaKey from variable name, e.g. "--sites-new-name" → "sites"
      const metaKey = varName.replace(/^--| -new-name$/g, "").replace(/-new-name$/, "");
      const cleanMetaKey = metaKey.replace(/^--/, "").replace(/-new-name$/, "");

      // Inject style if missing
      if (!document.querySelector(`style[data-meta="${cleanMetaKey}"]`)) {
        const style = document.createElement("style");
        style.dataset.meta = cleanMetaKey;
        style.innerHTML = `
          a[meta="${cleanMetaKey}"] .nav-title,
          a#${cleanMetaKey} .nav-title {
            visibility: hidden !important;
            position: relative !important;
          }
          a[meta="${cleanMetaKey}"] .nav-title::after,
          a#${cleanMetaKey} .nav-title::after {
            content: var(${varName}, "${cleanMetaKey}");
            visibility: visible !important;
            position: absolute !important;
            left: 0;
          }
        `;
        document.head.appendChild(style);
      }

      // Apply live CSS variable
      document.documentElement.style.setProperty(varName, `"${newLabel}"`);
    });
  } catch (err) {
    console.error("❌ Failed to apply stored sidebar titles:", err);
  }
}
window.__tbApplyStoredSidebarTitles = applyStoredSidebarTitles;

  // ---- Mutation observer (throttled) ----
  function observeSidebarMutations(sidebar) {
    if (!sidebar) return;
    let timer;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        ThemeBuilder._doReapplyTheme();
      }, 500);
    });
    observer.observe(sidebar, { childList: true, subtree: true });
    // store observer reference if you want to disconnect later
    return observer;
  }

  // ---- Wait for sidebar then re-apply ----
  async function waitForSidebarAndReapply(retries = 60) {
    for (let attempt = 0; attempt < retries; attempt++) {
      const sidebar = document.querySelector(".hl_nav-header nav");
      const menuItems = sidebar?.querySelectorAll("li, a, div[id^='sb_']") || [];
      if (sidebar && menuItems.length > 5) {
        ThemeBuilder._doReapplyTheme();
        observeSidebarMutations(sidebar);
        return true;
      }
      await sleep(300);
    }
    console.warn("[ThemeBuilder] Sidebar not found within retry window");
    return false;
  }
  function reorderMenu(order, containerSelector) {
      // Try the exact selector first (keeps agency behavior unchanged)
      let container = document.querySelector(containerSelector);
  
      // If selector not found, attempt to infer the container from the first existing menu item
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
  
      // If still not found, try a common sub-account selector (safe fallback)
      if (!container) {
          container = document.querySelector(".hl_nav-header nav") || document.querySelector(".hl_nav-header");
      }
  
      if (!container) return;
  
      order.forEach(id => {
          const el = document.getElementById(id);
          if (el) container.appendChild(el);
      });
  }
  // ---- Core reapply logic ----
  function _doReapplyTheme() {
    const savedRaw = localStorage.getItem(STORAGE.userTheme);
    const saved = safeJsonParse(savedRaw) || {};
    if (!saved.themeData) {
      log("No theme data found");
      return;
    }
    injectThemeData(saved.themeData);
    applySidebarLogoFromTheme();
    restoreHiddenMenus();
    applyHiddenMenus();
    applyLockedMenus();
    applySubaccountTheme();
    try {
      if (saved.themeData["--agencyMenuOrder"]) {
        const order = JSON.parse(saved.themeData["--agencyMenuOrder"]);
        reorderMenu(order, "#agencySidebar");
      }
    } catch (e) { console.error("[ThemeBuilder] reorder agency menus failed", e); }
  }
async function waitForStableSidebar(selector = '#sidebar-v2 nav.flex-1.w-full', timeout = 5000) {
  const start = Date.now();
  let lastHTML = '';
  while (Date.now() - start < timeout) {
    const el = document.querySelector(selector);
    if (!el) {
      await new Promise(r => setTimeout(r, 300));
      continue;
    }
    const currentHTML = el.innerHTML;
    if (currentHTML === lastHTML && currentHTML.length > 0) {
      // Sidebar content hasn't changed between two checks → stable
      return true;
    }
    lastHTML = currentHTML;
    await new Promise(r => setTimeout(r, 300));
  }
  // console.warn('[ThemeBuilder] Sidebar did not stabilize within timeout.');
  return false;
}

  // ---- SPA detection (history) ----
  (function () {
    const _push = history.pushState;
    history.pushState = function () { const res = _push.apply(this, arguments); window.dispatchEvent(new Event("locationchange")); return res; };
    const _replace = history.replaceState;
    history.replaceState = function () { const res = _replace.apply(this, arguments); window.dispatchEvent(new Event("locationchange")); return res; };
    window.addEventListener("popstate", () => window.dispatchEvent(new Event("locationchange")));
  })();

  // ---- exposed API and internal flags ----
  const ThemeBuilder = {
    _doReapplyTheme,
    applyCSSFile,
    applyAgencyLogo,
    applySidebarLogoFromTheme,
    reapply: () => {
      if (ThemeBuilder._reapplyLock) return;
      ThemeBuilder._reapplyLock = true;
        (async () => {
        await waitForStableSidebar();
        await waitForSidebarAndReapply();
        setTimeout(() => { ThemeBuilder._reapplyLock = false; }, 800);
      })();
    },
    _reapplyLock: false
  };

function fixSidebarCursor() {
  const navLinks = document.querySelectorAll('.hl_nav-header a, .hl_nav-header [tabindex], .hl_nav-header [role="menuitem"]');
  navLinks.forEach(el => {
    el.style.removeProperty('cursor');
  });
}

// Run on load
fixSidebarCursor();

// Re-run when GHL dynamically updates the sidebar
const sidebarObserver = new MutationObserver(() => {
  fixSidebarCursor();
});

const sidebar = document.querySelector('.hl_nav-header');
if (sidebar) {
  sidebarObserver.observe(sidebar, {
    childList: true,
    subtree: true,
    attributeFilter: ['style']
  });
} else {
  // If sidebar not ready yet, wait for it
  const bodyObserver = new MutationObserver(() => {
    const s = document.querySelector('.hl_nav-header');
    if (s) {
      fixSidebarCursor();
      sidebarObserver.observe(s, { childList: true, subtree: true, attributeFilter: ['style'] });
      bodyObserver.disconnect();
    }
  });
  bodyObserver.observe(document.body, { childList: true, subtree: true });
}

  
  // ---- Listen to SPA location changes ----

  // ---- Initial bootstrap ----
  // Run applyCSSFile (fetch + inject)
  try { ThemeBuilder.applyCSSFile(); } catch (e) { console.error("[ThemeBuilder] initial apply failed", e); }
  // Apply locked menus a bit later (gives DOM a chance)
  setTimeout(() => { try { applyLockedMenus(); } catch (e) {} }, 3000);
  setTimeout(() => { ThemeBuilder.reapply(); }, 400);
  ThemeBuilder.applyAgencyLogo();

    // ✅ Run once on initial load
  setTimeout(() => {
    applyStoredSidebarTitles();
  }, 1500);
  // Expose to global for manual debugging
  window.ThemeBuilder = ThemeBuilder;
  log("ThemeBuilder initialized");
})();

window.addEventListener("load", () => {
  console.log('Loader related It is working');
  document.body.classList.add("loaded");
  document.querySelectorAll("#app + .app-loader, #app > .hl-loader-container")
    .forEach(l => l.remove());
});
window.__TB_NAV_TRANSITION__ = false;
window.addEventListener("locationchange", () => {
    if (window.__TB_NAV_TRANSITION__) return;

    if (typeof window.__TB_cleanupMenuStates === "function") {
        window.__TB_cleanupMenuStates();
    }

    const isLeavingSubaccount = !window.location.pathname.includes("/location/");
    if (!isLeavingSubaccount) {
        ThemeBuilder.reapply();

        // Watch for sidebar DOM rebuild on agency→subaccount navigation
        // and inject icons the moment real new menu nodes exist
        let iconInjected = false;

        const iconWatcher = new MutationObserver(() => {
            const menus = document.querySelectorAll("#sidebar-v2 a[id^='sb_']");
            if (menus.length > 0 && !iconInjected) {
                iconInjected = true;
                iconWatcher.disconnect();

                const doApply = () => {
                    // applyMenuCustomizations and applyStoredSidebarTitles
                    // are in scope here via ThemeBuilder's closure exposure
                    if (typeof window.ThemeBuilder._doReapplyTheme === "function") {
                        // _doReapplyTheme already calls applyMenuCustomizations
                        // internally — but we need the repaint too
                    }
                    // Directly call via the reapply path which is safe and in scope
                    ThemeBuilder.reapply();
                    // Force repaint for FA glyphs
                    requestAnimationFrame(() => {
                        document.querySelectorAll(".tb-sidebar-icon").forEach(el => {
                            el.style.display = "none";
                            el.offsetHeight; // trigger reflow
                            el.style.display = "";
                        });
                    });
                };

                if (document.fonts && document.fonts.load) {
                    document.fonts.load('900 16px "Font Awesome 6 Free"')
                        .then(doApply)
                        .catch(doApply);
                } else {
                    doApply();
                }
            }
        });

        iconWatcher.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
            if (!iconInjected) {
                iconWatcher.disconnect();
            }
        }, 5000);
    }

    ThemeBuilder.applyAgencyLogo();

    const observer = new MutationObserver(() => {
        const img = document.querySelector(".agency-logo");
        if (img) {
            observer.disconnect();
            ThemeBuilder.applySidebarLogoFromTheme();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 5000);

    setTimeout(() => {
        applyStoredSidebarTitles();
        applyLockedMenus();
        applyHiddenMenus();
        applySubaccountTheme();
    }, 1200);
});
