(function () {
  const supported = ["ja", "zh-tw", "en"];
  const storageKey = "oshilove-site-language-manual-v3";
  const analyticsConsentKey = "oshi-analytics-consent-v1";
  const measurementId = "G-37KD0MLGN5";
  // Language switching also works in private mode or local file previews.
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch (_) {}

  function detectBrowserLanguage() {
    const preferences = Array.isArray(navigator.languages) && navigator.languages.length
      ? navigator.languages
      : [navigator.language];

    for (const preference of preferences) {
      const locale = String(preference || "").toLowerCase();
      if (locale === "ja" || locale.startsWith("ja-")) return "ja";
      if (locale === "zh" || locale.startsWith("zh-")) return "zh-tw";
      if (locale === "en" || locale.startsWith("en-")) return "en";
    }

    return "en";
  }

  const requestedLanguage = new URLSearchParams(window.location.search).get("lang") || document.documentElement.dataset.fixedLanguage;
  const language = supported.includes(requestedLanguage) ? requestedLanguage : supported.includes(saved) ? saved : detectBrowserLanguage();

  function getAnalyticsConsent() {
    try { return localStorage.getItem(analyticsConsentKey); } catch (_) { return null; }
  }

  function setAnalyticsConsent(value) {
    try { localStorage.setItem(analyticsConsentKey, value); } catch (_) {}
  }

  let analyticsConsent = getAnalyticsConsent();
  window[`ga-disable-${measurementId}`] = analyticsConsent !== "granted";

  function loadAnalytics() {
    // Radar queries and browser history can contain searched account names.
    // Do not initialise GA here, including its remote enhanced measurement.
    if (document.documentElement.dataset.page === "radar") return;
    if (analyticsConsent !== "granted") return;
    if (document.querySelector(`script[data-ga-id="${measurementId}"]`)) return;
    window[`ga-disable-${measurementId}`] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      wait_for_update: 500
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.dataset.gaId = measurementId;
    document.head.appendChild(script);
  }

  function applyAnalyticsChoice(choice) {
    if (choice !== "granted" && choice !== "denied") return;
    analyticsConsent = choice;
    setAnalyticsConsent(choice);
    if (choice === "granted") {
      loadAnalytics();
      return;
    }
    // Stop collection immediately. Reload removes the already-executed tag;
    // sending a denied consent update could itself send a cookieless ping.
    window[`ga-disable-${measurementId}`] = true;
    const loaded = document.querySelector(`script[data-ga-id="${measurementId}"]`);
    if (!loaded) return;
    window.gtag = function () {};
    const hostParts = window.location.hostname.split(".");
    document.cookie.split(";").forEach((entry) => {
      const name = entry.split("=")[0].trim();
      if (name !== "_ga" && !name.startsWith("_ga_")) return;
      const expired = `${name}=; Max-Age=0; path=/`;
      document.cookie = expired;
      for (let i = 0; i < hostParts.length - 1; i += 1) {
        document.cookie = `${expired}; domain=${hostParts.slice(i).join(".")}`;
      }
    });
    loaded.remove();
    window.location.reload();
  }

  function createConsentBanner(event) {
    if (document.querySelector("[data-analytics-consent]")) return;
    const banner = document.createElement("section");
    banner.className = "analytics-consent";
    banner.dataset.analyticsConsent = "";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", ({ja: "アクセス解析設定", "zh-tw": "網站分析設定", en: "Analytics preferences"})[document.documentElement.dataset.language]);
    const returnFocus = event ? document.activeElement : null;
    banner.tabIndex = -1;
    banner.innerHTML = `
      <div class="analytics-consent-copy">
        <strong><span data-lang="ja">アクセス解析について</span><span data-lang="zh-tw">關於網站分析</span><span data-lang="en">About analytics</span></strong>
        <p><span data-lang="ja">サイトの改善に Google Analytics を使用します。同意した場合のみ読み込まれ、解析用 Cookie が有効になります。同意前や拒否した場合は、Google Analytics にデータを送信しません。設定はページ下部からいつでも変更できます</span><span data-lang="zh-tw">我們只會在您接受後載入 Google Analytics 並啟用分析 Cookie；未選擇或拒絕時，不會向 Google Analytics 傳送資料。您可隨時在頁尾更改設定</span><span data-lang="en">Google Analytics loads and enables analytics cookies only after you accept. No data is sent to Google Analytics before consent or if you decline. Change your choice anytime in the footer</span> <a href="${localizedPath('/privacy', document.documentElement.dataset.language)}"><span data-lang="ja">詳細</span><span data-lang="zh-tw">了解詳情</span><span data-lang="en">Learn more</span></a></p>
      </div>
      <div class="analytics-consent-actions">
        <button type="button" class="consent-button secondary" data-consent="denied"><span data-lang="ja">同意しない</span><span data-lang="zh-tw">拒絕</span><span data-lang="en">Decline</span></button>
        <button type="button" class="consent-button primary" data-consent="granted"><span data-lang="ja">同意する</span><span data-lang="zh-tw">接受</span><span data-lang="en">Accept</span></button>
      </div>`;
    const existingChoice = getAnalyticsConsent();
    if (existingChoice) {
      const status = document.createElement("p");
      const granted = existingChoice === "granted";
      status.innerHTML = `<span data-lang="ja">現在の設定：${granted ? "同意済み" : "拒否"}</span><span data-lang="zh-tw">目前設定：${granted ? "已接受" : "已拒絕"}</span><span data-lang="en">Current choice: ${granted ? "accepted" : "declined"}</span>`;
      banner.querySelector(".analytics-consent-copy").appendChild(status);
    }
    document.body.appendChild(banner);
    if (returnFocus) banner.focus();
    banner.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && returnFocus) { banner.remove(); returnFocus.focus(); }
    });
    banner.querySelectorAll("[data-consent]").forEach((button) => {
      button.addEventListener("click", () => {
        const choice = button.dataset.consent;
        applyAnalyticsChoice(choice);
        banner.remove();
        if (returnFocus) returnFocus.focus();
      });
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === analyticsConsentKey) {
      applyAnalyticsChoice(event.newValue === "granted" ? "granted" : "denied");
    }
  });

  function addAnalyticsSettingsControl() {
    if (document.documentElement.dataset.page === "radar") return;
    const footer = document.querySelector("footer");
    if (!footer || footer.querySelector("[data-analytics-settings]")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "analytics-settings";
    button.dataset.analyticsSettings = "";
    button.innerHTML = '<span data-lang="ja">アクセス解析設定</span><span data-lang="zh-tw">網站分析設定</span><span data-lang="en">Analytics settings</span>';
    button.addEventListener("click", createConsentBanner);
    footer.appendChild(button);
  }

  function apply(nextLanguage, remember = false) {
    document.documentElement.dataset.language = nextLanguage;
    document.documentElement.lang = nextLanguage === "zh-tw" ? "zh-Hant" : nextLanguage;
    if (remember) {
      try { localStorage.setItem(storageKey, nextLanguage); } catch (_) {}
      const url = new URL(window.location.href);
      url.searchParams.set("lang", nextLanguage);
      window.history.replaceState(null, "", url);
    }
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      select.value = nextLanguage;
    });
    document.querySelectorAll("a[data-site-lang]").forEach(link => {
      const url = new URL(link.href);
      url.pathname = localizedPath(url.pathname, nextLanguage);
      url.searchParams.delete("lang");
      link.href = url.href;
    });
    const title = document.querySelector(`[data-page-title-${nextLanguage}]`);
    if (title) document.title = title.getAttribute(`data-page-title-${nextLanguage}`);
    const description = document.querySelector(`[data-page-description-${nextLanguage}]`);
    if (description) {
      description.setAttribute("content", description.getAttribute(`data-page-description-${nextLanguage}`));
    }
    const labels = {
      ja: ["メインナビゲーション", "言語", "OshiLove と Oshi Pocket の画面", "OshiLove のホーム画面", "OshiLove の推しプロフィール画面", "Oshi Pocket の支出統計画面"],
      "zh-tw": ["主要導覽", "語言", "OshiLove 與 Oshi Pocket 畫面", "OshiLove 首頁畫面", "OshiLove 推し個人檔案畫面", "Oshi Pocket 開支統計畫面"],
      en: ["Main navigation", "Language", "OshiLove and Oshi Pocket previews", "OshiLove home screen", "OshiLove oshi profile screen", "Oshi Pocket spending statistics screen"]
    }[nextLanguage];
    document.querySelector(".landing-nav")?.setAttribute("aria-label", labels[0]);
    document.querySelectorAll("[data-language-select]").forEach(el => el.setAttribute("aria-label", labels[1]));
    document.querySelector(".mobile-language-label")?.replaceChildren(labels[1]);
    const menuButton = document.querySelector(".mobile-menu-toggle");
    if (menuButton) menuButton.setAttribute("aria-label", menuLabel(menuButton.getAttribute("aria-expanded") === "true"));
    document.querySelector(".footer-products")?.setAttribute("aria-label", ({ja: "アプリのポリシーとサポート", "zh-tw": "App 政策與支援", en: "App policies and support"})[nextLanguage]);
    const topLabel = ({ja: "ページの先頭へ", "zh-tw": "返回頁頂", en: "Back to top"})[nextLanguage];
    document.querySelector(".back-to-top")?.setAttribute("aria-label", topLabel);
    document.querySelector(".back-to-top")?.setAttribute("title", topLabel);
    document.querySelector(".hero-stage")?.setAttribute("aria-label", labels[2]);
    document.querySelectorAll('img[src="oshilove-home.webp"]').forEach(el => el.alt = labels[3]);
    document.querySelectorAll('img[src$="oshilove-profile.webp"]').forEach(el => el.alt = labels[4]);
    document.querySelectorAll('img[src$="oshipocket-stats.webp"]').forEach(el => el.alt = labels[5]);
    if (description) {
      document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
      document.querySelector('meta[property="og:description"]')?.setAttribute("content", description.content);
    }
  }

  function menuLabel(open) {
    return ({ja: open ? "メニューを閉じる" : "メニューを開く", "zh-tw": open ? "關閉選單" : "開啟選單", en: open ? "Close menu" : "Open menu"})[document.documentElement.dataset.language || language];
  }

  function localizedPath(path, lang) {
    let page = path.replace(/\.html$/, "").replace(/^\/(?:en|zh-tw)(?=\/|$)/, "");
    if (["", "/", "/index", "/ja"].includes(page)) page = "";
    return (lang === "ja" ? "" : "/" + lang) + page || "/";
  }

  function setupMobileNavigation() {
    const header = document.querySelector(".landing-header");
    const nav = header?.querySelector(".landing-nav");
    const links = nav?.querySelector(".nav-sections");
    const controls = nav?.querySelector(".nav-controls");
    const languageSelect = controls?.querySelector("[data-language-select]");
    const toolsMenu = links?.querySelector(".nav-tools");
    if (!header || !links || !controls || !languageSelect) return;
    links.id = links.id || "site-navigation-links";
    const languageRow = document.createElement("label");
    languageRow.className = "mobile-menu-language";
    const languageLabel = document.createElement("span");
    languageLabel.className = "mobile-language-label";
    languageRow.append(languageLabel);
    links.append(languageRow);
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "mobile-menu-toggle";
    toggle.setAttribute("aria-controls", links.id);
    toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path class="menu-open-icon" d="M4 7h16M4 12h16M4 17h16"/><path class="menu-close-icon" d="m6 6 12 12M18 6 6 18"/></svg>';
    controls.append(toggle);
    function setOpen(open, restoreFocus = false) {
      if (!open && toolsMenu) toolsMenu.open = false;
      header.classList.toggle("is-menu-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", menuLabel(open));
      if (restoreFocus) toggle.focus({preventScroll: true});
    }
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    header.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      if (toolsMenu?.open) {
        event.preventDefault();
        toolsMenu.open = false;
        toolsMenu.querySelector("summary")?.focus({preventScroll: true});
      } else if (toggle.getAttribute("aria-expanded") === "true") {
        event.preventDefault();
        setOpen(false, true);
      }
    });
    header.addEventListener("click", event => {
      if (event.target.closest("a")) setOpen(false);
      else if (toolsMenu?.open && !toolsMenu.contains(event.target)) toolsMenu.open = false;
    });
    toolsMenu?.addEventListener("focusout", event => {
      if (event.relatedTarget && !toolsMenu.contains(event.relatedTarget)) toolsMenu.open = false;
    });
    document.addEventListener("click", event => {
      if (!header.contains(event.target)) setOpen(false);
    });
    const mobile = window.matchMedia("(max-width: 760px)");
    function updateLayout() {
      setOpen(false);
      if (mobile.matches) languageRow.append(languageSelect);
      else controls.prepend(languageSelect);
    }
    mobile.addEventListener("change", updateLayout);
    header.classList.add("has-mobile-menu");
    updateLayout();
  }

  document.addEventListener("DOMContentLoaded", function () {
    setupMobileNavigation();
    apply(language);
    addAnalyticsSettingsControl();
    loadAnalytics();
    if (getAnalyticsConsent() === null && document.documentElement.dataset.page !== "radar") createConsentBanner();
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      select.addEventListener("change", (event) => {
        if (document.documentElement.dataset.fixedLanguage) {
          try { localStorage.setItem(storageKey, event.target.value); } catch (_) {}
          const url = new URL(location.href);
          url.pathname = localizedPath(url.pathname, event.target.value);
          url.searchParams.delete("lang");
          window.location.assign(url.href);
          return;
        }
        if (document.body.classList.contains("landing")) {
          try { localStorage.setItem(storageKey, event.target.value); } catch (_) {}
          window.location.assign(event.target.value + ".html" + window.location.hash);
          return;
        }
        apply(event.target.value, true);
        if (analyticsConsent === "granted" && window.gtag) window.gtag("event", "language_change", { language: event.target.value });
      });
    });

    document.querySelectorAll('a[href*="apps.apple.com"]').forEach((link) => {
      link.addEventListener("click", () => {
        if (analyticsConsent !== "granted" || !window.gtag) return;
        const app = link.href.includes("6811325536") ? "Oshi Pocket" : "OshiLove";
        window.gtag("event", "app_store_click", { app_name: app, link_url: link.href });
      });
    });

    // Landing-page copy intentionally omits sentence-ending full stops.
    document.querySelectorAll("body:not(.privacy-policy) main [data-lang], body:not(.privacy-policy) footer [data-lang]").forEach((element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        walker.currentNode.nodeValue = walker.currentNode.nodeValue
          .replace(/[。.]\s*$/, "")
          .replace(/。(?=\S)/g, " · ");
      }
    });

    // Reversible disclosure motion; native details remain the no-JS fallback.
    document.querySelectorAll(".faq-list details").forEach((details) => {
      const summary = details.querySelector("summary");
      const answer = details.querySelector("p");
      let animation;
      let expanded = details.open;
      summary.setAttribute("aria-expanded", String(expanded));
      summary.addEventListener("click", (event) => {
        event.preventDefault();
        const from = details.getBoundingClientRect().height;
        animation?.cancel();
        expanded = !expanded;
        details.open = true;
        summary.setAttribute("aria-expanded", String(expanded));
        details.classList.toggle("is-expanded", expanded);
        const to = expanded ? details.scrollHeight : summary.getBoundingClientRect().height;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduced || !details.animate) {
          details.open = expanded;
          if (expanded) answer.animate?.([{opacity: 0}, {opacity: 1}], {duration: 180});
          return;
        }
        details.style.overflow = "hidden";
        animation = details.animate([{height: from + "px"}, {height: to + "px"}],
          {duration: 320, easing: "cubic-bezier(.22, 1, .36, 1)"});
        const current = animation;
        animation.onfinish = () => {
          if (animation !== current) return;
          details.open = expanded;
          details.style.overflow = "";
          animation = null;
        };
      });
    });
    let backToTop;
    if (document.body.classList.contains("landing")) {
      backToTop = document.createElement("button");
      backToTop.type = "button";
      backToTop.className = "back-to-top";
      backToTop.disabled = true;
      backToTop.tabIndex = -1;
      backToTop.innerHTML = '<svg class="line-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 11l6-6 6 6M12 5v14"/></svg>';
      document.body.appendChild(backToTop);
      apply(document.documentElement.dataset.language);
      backToTop.addEventListener("click", () => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({top: 0, behavior: reduced ? "instant" : "smooth"});
        document.querySelector(".landing-brand")?.focus({preventScroll: true});
      });
    }
    const navLinks = [...document.querySelectorAll(".nav-sections a")];
    const sections = ["choose", "apps", "how-it-works", "faq"]
      .map(id => document.getElementById(id)).filter(Boolean);
    let pending = false;
    const updateNavigation = () => {
      pending = false;
      if (backToTop) {
        const visible = window.scrollY > 320;
        backToTop.classList.toggle("is-visible", visible);
        backToTop.disabled = !visible;
        backToTop.tabIndex = visible ? 0 : -1;
      }
      const header = document.querySelector(".landing-header");
      const mobile = window.matchMedia("(max-width: 760px)").matches;
      // Hysteresis prevents the row flickering near the top after its height changes.
      const collapsed = header?.classList.contains("is-compact");
      const compact = mobile && window.scrollY > (collapsed ? 16 : 64);
      header?.classList.toggle("is-compact", compact);
      document.body.classList.toggle("compact-header", compact);
      const edge = (document.querySelector(".landing-header")?.getBoundingClientRect().bottom || 0) + 48;
      let active = "";
      sections.forEach(section => { if (section.getBoundingClientRect().top <= edge) active = section.id; });
      if (active === "choose") active = "apps";
      navLinks.forEach(link => {
        const selected = link.hash === "#" + active;
        link.classList.toggle("is-current", selected);
        if (selected) link.setAttribute("aria-current", "location");
        else if (link.getAttribute("aria-current") === "location") link.removeAttribute("aria-current");
      });
    };
    window.addEventListener("scroll", () => {
      if (!pending) { pending = true; requestAnimationFrame(updateNavigation); }
    }, {passive: true});
    window.addEventListener("resize", updateNavigation);
    updateNavigation();

    if (!document.body.classList.contains("landing") && "IntersectionObserver" in window) {
      const revealTargets = document.querySelectorAll([
        ".section-heading",
        ".feature-section",
        ".choice-card",
        ".privacy-panel",
        ".getting-started article",
        ".faq-list details",
        ".download-section"
      ].join(","));

      document.documentElement.classList.add("reveal-ready");
      revealTargets.forEach((element, index) => {
        element.classList.add("reveal-on-scroll");
        element.style.setProperty("--reveal-delay", `${(index % 4) * 75}ms`);
      });

      const observer = new IntersectionObserver((entries) => {
        window.requestAnimationFrame(() => {
          entries.forEach((entry) => {
            const isVisible = entry.target.classList.contains("is-visible");
            if (!isVisible && entry.intersectionRatio >= 0.14) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        });
      }, { threshold: [0, 0.03, 0.14], rootMargin: "0px 0px -2%" });

      revealTargets.forEach((element) => observer.observe(element));
    }
  });
})();
