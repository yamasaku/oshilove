(function () {
  const supported = ["ja", "zh-tw", "en"];
  const storageKey = "oshilove-site-language-v2";
  // Language switching also works in private mode or local file previews.
  let saved;
  try { saved = localStorage.getItem(storageKey); } catch (_) {}
  const language = supported.includes(saved) ? saved : "ja";

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
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      select.addEventListener("change", (event) => apply(event.target.value));
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
