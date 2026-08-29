(function () {
  const supported = ["ja", "zh-tw", "en"];
  const saved = localStorage.getItem("oshilove-site-language");
  const browser = (navigator.language || "ja").toLowerCase();
  const detected = browser.startsWith("zh") ? "zh-tw" : browser.startsWith("en") ? "en" : "ja";
  const language = supported.includes(saved) ? saved : detected;

  function apply(nextLanguage) {
    document.documentElement.dataset.language = nextLanguage;
    document.documentElement.lang = nextLanguage === "zh-tw" ? "zh-Hant" : nextLanguage;
    localStorage.setItem("oshilove-site-language", nextLanguage);
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      select.value = nextLanguage;
    });
    const title = document.querySelector(`[data-page-title-${nextLanguage}]`);
    if (title) document.title = title.getAttribute(`data-page-title-${nextLanguage}`);
  }

  document.addEventListener("DOMContentLoaded", function () {
    apply(language);
    document.querySelectorAll("[data-language-select]").forEach((select) => {
      select.addEventListener("change", (event) => apply(event.target.value));
    });
  });
})();

