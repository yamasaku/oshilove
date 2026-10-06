(function () {
  const supported = ["ja", "zh-tw", "en"];
  const storageKey = "oshilove-site-language-v2";
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

  const language = supported.includes(saved) ? saved : detectBrowserLanguage();

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

  function createConsentBanner() {
    if (document.querySelector("[data-analytics-consent]")) return;
    const banner = document.createElement("section");
    banner.className = "analytics-consent";
    banner.dataset.analyticsConsent = "";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Analytics preferences");
    banner.innerHTML = `
      <div class="analytics-consent-copy">
        <strong><span data-lang="ja">アクセス解析について</span><span data-lang="zh-tw">關於網站分析</span><span data-lang="en">About analytics</span></strong>
        <p><span data-lang="ja">同意前は Cookie を使用しない限定的な測定のみ行い、同意後に詳細な Google Analytics を有効にします</span><span data-lang="zh-tw">同意前只進行不使用 Cookie 的有限測量，同意後才啟用完整 Google Analytics</span><span data-lang="en">Before consent, only limited cookieless measurement is used. Full Google Analytics starts after consent</span> <a href="privacy.html"><span data-lang="ja">詳細</span><span data-lang="zh-tw">了解詳情</span><span data-lang="en">Learn more</span></a></p>
      </div>
      <div class="analytics-consent-actions">
        <button type="button" class="consent-button secondary" data-consent="denied"><span data-lang="ja">同意しない</span><span data-lang="zh-tw">拒絕</span><span data-lang="en">Decline</span></button>
        <button type="button" class="consent-button primary" data-consent="granted"><span data-lang="ja">同意する</span><span data-lang="zh-tw">接受</span><span data-lang="en">Accept</span></button>
      </div>`;
    document.body.appendChild(banner);
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

  function apply(nextLanguage) {
    document.documentElement.dataset.language = nextLanguage;
    document.documentElement.lang = nextLanguage === "zh-tw" ? "zh-Hant" : nextLanguage;
    try { localStorage.setItem(storageKey, nextLanguage); } catch (_) {}
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      select.value = nextLanguage;
    });
    const title = document.querySelector(`[data-page-title-${nextLanguage}]`);
    if (title) document.title = title.getAttribute(`data-page-title-${nextLanguage}`);
    const description = document.querySelector(`[data-page-description-${nextLanguage}]`);
    if (description) {
      description.setAttribute("content", description.getAttribute(`data-page-description-${nextLanguage}`));
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    apply(language);
    addAnalyticsSettingsControl();
    loadAnalytics();
    if (getAnalyticsConsent() === null) createConsentBanner();
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      select.addEventListener("change", (event) => {
        apply(event.target.value);
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
          .replace(/。/g, "")
          .replace(/\.(?=\s|$)/g, "");
      }
    });

    if ("IntersectionObserver" in window) {
      const revealTargets = document.querySelectorAll([
        ".section-heading",
        ".feature-section",
        ".choice-card",
        ".privacy-panel",
        ".steps li",
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
            } else if (isVisible && entry.intersectionRatio <= 0.03) {
              entry.target.classList.remove("is-visible");
            }
          });
        });
      }, { threshold: [0, 0.03, 0.14], rootMargin: "0px 0px -2%" });

      revealTargets.forEach((element) => observer.observe(element));
    }
  });
})();
