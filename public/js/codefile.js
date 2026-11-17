(function () {
  var LOADER_CACHE_KEY = 'tb_loader_config';

  // === Step 1: Inject hide style immediately ===
  var styleEl = document.createElement('style');
  styleEl.id = 'custom-loader-hide-style';
  styleEl.innerHTML = 'html, body { opacity: 0 !important; visibility: hidden !important; }\n.hl-loader-container, .lds-ring, .app-loader, #app + .app-loader, #app.loading + .app-loader { display: none !important; }';
  (document.head || document.documentElement).appendChild(styleEl);

  // === Step 2: Build loader CSS from cache ===
  function buildLoaderCSS(config) {
    if (!config || !config.logoUrl) return '';
    var bg = config.bgColor || 'linear-gradient(180deg, #0074f7 0%, #00c0f7 100%)';
    var animation = config.animationType === 'BouncingLogo'
      ? '@keyframes loaderAnim{0%,100%{transform:translateY(0)}25%{transform:translateY(-30px)}50%{transform:translateY(0)}75%{transform:translateY(-15px)}} #custom-global-loader::before{animation:loaderAnim 1s ease-in-out infinite;}'
      : '@keyframes loaderAnim{0%{opacity:0.7;transform:scale(0.95)}100%{opacity:1;transform:scale(1.05)}} #custom-global-loader::before{animation:loaderAnim 1s ease-in-out infinite alternate;}';
    return '.hl-loader-container,.lds-ring,.app-loader,#app+.app-loader,#app.loading+.app-loader{display:none!important}'
      + '#custom-global-loader{position:fixed;top:0;left:0;width:100%;height:100vh;background:' + bg + ';display:flex;justify-content:center;align-items:center;z-index:999999;}'
      + '#custom-global-loader::before{content:"";width:120px;height:120px;background:url("' + config.logoUrl + '")center/contain no-repeat;}'
      + animation;
  }

  // === Step 3: Apply cached loader CSS immediately ===
 try {
  var cached = JSON.parse(localStorage.getItem(LOADER_CACHE_KEY) || 'null');
  var cssToInject = (cached && cached.fullCSS) ? cached.fullCSS : buildLoaderCSS(cached);
  if (cssToInject) {
    var cachedStyle = document.createElement('style');
    cachedStyle.id = 'tb-loader-cached-style';
    cachedStyle.innerHTML = cssToInject;
    (document.head || document.documentElement).appendChild(cachedStyle);
  }
} catch (e) {}

  // === Step 4: Two-gate system (same as before) ===
  var pageLoaded = false;
  var themeApplied = false;
  var loaderInjected = false;
  var maxWait = setTimeout(function () { themeApplied = true; pageLoaded = true; tryRemoveLoader(); }, 8000);

  window.__themeReady = function () { themeApplied = true; tryRemoveLoader(); };

  // === Step 5: Expose cache update function for code.js to call ===
  window.__updateLoaderCache = function (config) {
  try {
    var current = JSON.parse(localStorage.getItem(LOADER_CACHE_KEY) || 'null');
    var changed = !current
      || current.logoUrl !== config.logoUrl
      || current.animationType !== config.animationType
      || current.fullCSS !== config.fullCSS;
    if (changed) {
      localStorage.setItem(LOADER_CACHE_KEY, JSON.stringify(config));
    }
  } catch (e) {}
};

  function tryRemoveLoader() {
    if (!pageLoaded || !themeApplied) return;
    clearTimeout(maxWait);
    var el = document.getElementById('custom-global-loader');
    if (el) {
      el.style.transition = 'opacity 0.5s ease';
      el.style.opacity = '0';
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 550);
    }
    var hide = document.getElementById('custom-loader-hide-style');
    if (hide && hide.parentNode) hide.parentNode.removeChild(hide);
  }

  function injectLoader() {
    if (document.body && !loaderInjected) {
      loaderInjected = true;
      var hide = document.getElementById('custom-loader-hide-style');
      if (hide) hide.innerHTML = '.hl-loader-container,.lds-ring,.app-loader,#app+.app-loader,#app.loading+.app-loader{display:none!important}';
      var loader = document.createElement('div');
      loader.id = 'custom-global-loader';
      document.body.insertBefore(loader, document.body.firstChild);
      document.documentElement.style.opacity = '';
      document.documentElement.style.visibility = '';
      document.body.style.opacity = '';
      document.body.style.visibility = '';
    } else if (!document.body) {
      setTimeout(injectLoader, 5);
    }
  }
  injectLoader();

  if (document.readyState === 'complete') {
    pageLoaded = true;
  } else {
    window.addEventListener('load', function () { pageLoaded = true; tryRemoveLoader(); });
  }
})();

(function () {
    function findAndStore() {
        const KEY = "g-em";

        function tryStore() {
            const existing = localStorage.getItem(KEY);
            if (existing) return;

            const emailDiv = document.querySelector("div.text-xs.text-gray-900.truncate");
            if (emailDiv) {
                const email = emailDiv.textContent.trim();
                if (email) {
                    localStorage.setItem(KEY, btoa(email));
                }
            } else {
                setTimeout(tryStore, 500);
            }
        }

        tryStore();
    }

    if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", findAndStore);
    } else {
        // DOM already loaded
        findAndStore();
    }
})();
