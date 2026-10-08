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

  function loadAnalytics() {
    if (document.querySelector(`script[data-ga-id="${measurementId}"]`)) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    const analyticsGranted = getAnalyticsConsent() === "granted";
    window.gtag("consent", "default", {
      analytics_storage: analyticsGranted ? "granted" : "denied",
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
        <p><span data-lang="ja">サイトの改善に Google Analytics を使用します。同意すると解析用 Cookie が有効になります。拒否しても Cookie を使わない測定は行われます。設定はページ下部からいつでも変更できます</span><span data-lang="zh-tw">我們使用 Google Analytics 了解網站使用情況，以改善網站；接受會啟用分析 Cookie，拒絕後仍會進行不使用 Cookie 的測量，您可隨時在頁尾更改設定</span><span data-lang="en">We use Google Analytics to improve the site. Accept enables analytics cookies; declining still allows cookieless measurement. Change your choice anytime in the footer</span> <a href="privacy.html"><span data-lang="ja">詳細</span><span data-lang="zh-tw">了解詳情</span><span data-lang="en">Learn more</span></a></p>
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
        setAnalyticsConsent(choice);
        if (window.gtag) {
          window.gtag("consent", "update", {
            analytics_storage: choice === "granted" ? "granted" : "denied",
            ad_storage: "denied",
            ad_user_data: "denied",
            ad_personalization: "denied"
          });
        }
        banner.remove();
        if (returnFocus) returnFocus.focus();
      });
    });
  }

  function addAnalyticsSettingsControl() {
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
    const title = document.querySelector(`[data-page-title-${nextLanguage}]`);
    if (title) document.title = title.getAttribute(`data-page-title-${nextLanguage}`);
    const description = document.querySelector(`[data-page-description-${nextLanguage}]`);
    if (description) {
      description.setAttribute("content", description.getAttribute(`data-page-description-${nextLanguage}`));
    }
    const labels = {
      ja: ["メインナビゲーション", "言語", "OshiLove と OshiPocket の画面", "OshiLove のホーム画面", "OshiLove の推しプロフィール画面", "OshiPocket の支出統計画面"],
      "zh-tw": ["主要導覽", "語言", "OshiLove 與 OshiPocket 畫面", "OshiLove 首頁畫面", "OshiLove 推し個人檔案畫面", "OshiPocket 開支統計畫面"],
      en: ["Main navigation", "Language", "OshiLove and OshiPocket previews", "OshiLove home screen", "OshiLove oshi profile screen", "OshiPocket spending statistics screen"]
    }[nextLanguage];
    document.querySelector(".landing-nav")?.setAttribute("aria-label", labels[0]);
    document.querySelectorAll("[data-language-select]").forEach(el => el.setAttribute("aria-label", labels[1]));
    document.querySelector(".footer-products")?.setAttribute("aria-label", ({ja: "アプリのポリシーとサポート", "zh-tw": "App 政策與支援", en: "App policies and support"})[nextLanguage]);
    const topLabel = ({ja: "ページの先頭へ", "zh-tw": "返回頁頂", en: "Back to top"})[nextLanguage];
    document.querySelector(".back-to-top")?.setAttribute("aria-label", topLabel);
    document.querySelector(".back-to-top")?.setAttribute("title", topLabel);
    document.querySelector(".hero-stage")?.setAttribute("aria-label", labels[2]);
    document.querySelectorAll('img[src="oshilove-home.webp"]').forEach(el => el.alt = labels[3]);
    document.querySelectorAll('img[src="oshilove-profile.webp"]').forEach(el => el.alt = labels[4]);
    document.querySelectorAll('img[src="oshipocket-stats.webp"]').forEach(el => el.alt = labels[5]);
    if (description) {
      document.querySelector('meta[property="og:title"]')?.setAttribute("content", document.title);
      document.querySelector('meta[property="og:description"]')?.setAttribute("content", description.content);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    apply(language);
    addAnalyticsSettingsControl();
    loadAnalytics();
    if (getAnalyticsConsent() === null) createConsentBanner();
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      select.addEventListener("change", (event) => {
        if (document.body.classList.contains("landing")) {
          try { localStorage.setItem(storageKey, event.target.value); } catch (_) {}
          window.location.assign(event.target.value + ".html" + window.location.hash);
          return;
        }
        apply(event.target.value, true);
        if (window.gtag) window.gtag("event", "language_change", { language: event.target.value });
      });
    });

    document.querySelectorAll('a[href*="apps.apple.com"]').forEach((link) => {
      link.addEventListener("click", () => {
        if (!window.gtag) return;
        const app = link.href.includes("6811325536") ? "OshiPocket" : "OshiLove";
        window.gtag("event", "app_store_click", { app_name: app, link_url: link.href });
      });
    });

    // Landing-page copy intentionally omits sentence-ending full stops.
    document.querySelectorAll("main [data-lang], footer [data-lang]").forEach((element) => {
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
    const sections = ["apps", "choose", "how-it-works", "faq", "download"]
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
        else link.removeAttribute("aria-current");
      });
    };
    window.addEventListener("scroll", () => {
      if (!pending) { pending = true; requestAnimationFrame(updateNavigation); }
    }, {passive: true});
    window.addEventListener("resize", updateNavigation);
    updateNavigation();

    if ("IntersectionObserver" in window) {
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
