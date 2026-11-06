(() => {
  const switches = [...document.querySelectorAll(".support-switch")];
  const buttons = switches.flatMap(group => [...group.querySelectorAll("[data-support-select]")]);
  const answers = document.querySelectorAll("[data-support-app]");
  const validApp = app => app === "oshilove" || app === "oshipocket";

  function showApp(app) {
    for (const button of buttons) {
      button.setAttribute("aria-pressed", String(button.dataset.supportSelect === app));
    }
    for (const answer of answers) {
      answer.hidden = answer.dataset.supportApp !== app;
    }
  }

  function applyLink() {
    const app = location.hash.slice(1);
    showApp(validApp(app) ? app : "oshilove");
    if (!validApp(app)) return;
    const answer = document.getElementById(app + "-" + document.documentElement.dataset.language);
    if (answer) {
      answer.open = true;
      answer.scrollIntoView({ block: "start" });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    for (const group of switches) group.hidden = false;
    document.body.classList.add("support-filter-ready");
    applyLink();
  });
  for (const button of buttons) {
    button.addEventListener("click", () => {
      const app = button.dataset.supportSelect;
      const url = new URL(location.href);
      url.hash = app;
      history.replaceState(null, "", url);
      showApp(app);
    });
  }
  window.addEventListener("hashchange", applyLink);
})();
