(() => {
  const allowed = {
    "resume-lang": ["en", "ar"],
    "resume-theme": ["light", "dark"],
    "resume-contrast": ["normal", "high"],
    "resume-audio-rate": ["0.75", "1", "1.25", "1.5", "2"],
  };
  window.resumePreferences = {
    get(key) {
      try {
        const value = localStorage.getItem(key);
        return allowed[key]?.includes(value) ? value : null;
      } catch {
        return null;
      }
    },
    set(key, value) {
      if (!allowed[key]?.includes(value)) return;
      try {
        localStorage.setItem(key, value);
      } catch {
        // Preferences still apply to this page when persistence is unavailable.
      }
    },
  };
  const root = document.documentElement;
  const routeLanguage = location.pathname.match(/^\/(en|ar)(?:\/|$)/)?.[1];
  const storedLanguage = window.resumePreferences.get("resume-lang");
  const language =
    routeLanguage ||
    storedLanguage ||
    (navigator.languages?.some((value) => value.toLowerCase().startsWith("ar"))
      ? "ar"
      : "en");
  const theme =
    window.resumePreferences.get("resume-theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const contrast = window.resumePreferences.get("resume-contrast") || "normal";

  root.lang = language;
  root.dir = language === "ar" ? "rtl" : "ltr";
  root.dataset.theme = theme;
  root.dataset.contrast = contrast;
})();
