(() => {
  const root = document.documentElement;
  const routeLanguage = location.pathname.match(/^\/(en|ar)(?:\/|$)/)?.[1];
  const storedLanguage = localStorage.getItem("resume-lang");
  const language =
    routeLanguage ||
    storedLanguage ||
    (navigator.languages?.some((value) => value.toLowerCase().startsWith("ar"))
      ? "ar"
      : "en");
  const theme =
    localStorage.getItem("resume-theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const contrast = localStorage.getItem("resume-contrast") || "normal";

  root.lang = language;
  root.dir = language === "ar" ? "rtl" : "ltr";
  root.dataset.theme = theme;
  root.dataset.contrast = contrast;
})();
