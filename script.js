import { translations } from "./data/translations.js";

const root = document.documentElement;
const storageKeys = {
  theme: "resume-theme",
  lang: "resume-lang",
  contrast: "resume-contrast",
};

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = window.resumePreferences.get(storageKeys.theme);
const routeLanguage = location.pathname.match(/^\/(en|ar)(?:\/|$)/)?.[1];
const savedLang =
  routeLanguage ||
  window.resumePreferences.get(storageKeys.lang) ||
  (navigator.languages?.some((language) =>
    language.toLowerCase().startsWith("ar"),
  )
    ? "ar"
    : "en");
const savedContrast =
  window.resumePreferences.get(storageKeys.contrast) || "normal";

const metaNodes = {
  description: document.getElementById("meta-description"),
  themeColor: document.querySelector('meta[name="theme-color"]'),
  ogTitle: document.getElementById("og-title"),
  ogDescription: document.getElementById("og-description"),
  twitterTitle: document.getElementById("twitter-title"),
  twitterDescription: document.getElementById("twitter-description"),
  personSchema: document.getElementById("person-schema"),
};

const copyToast =
  document.querySelector(".copy-toast") || document.createElement("div");
let toastTimer = 0;

copyToast.setAttribute("role", "status");
copyToast.setAttribute("aria-live", "polite");
copyToast.setAttribute("aria-atomic", "true");

if (!copyToast.isConnected) {
  copyToast.className = "copy-toast";
  document.body.appendChild(copyToast);
}

const siteMeta = {
  url: "https://creativemahdy.space/",
  image: "https://creativemahdy.space/assets/ahmed-mahdy.png",
  email: "mailto:amahdy59@gmail.com",
  sameAs: [
    "https://www.linkedin.com/in/creativemahdy",
    "https://dribbble.com/creativemahdy",
  ],
  knowsAbout: [
    "UX Design",
    "Data Visualization",
    "Data Analytics",
    "Power BI",
    "Tableau",
    "Microsoft Excel",
    "SQL",
    "Python",
    "AI-assisted product design",
  ],
};

/**
 * Returns the current active language from the root element's lang attribute.
 * @returns {'en'|'ar'} The current language code.
 */
function getCurrentLanguage() {
  return root.getAttribute("lang") || "en";
}

/**
 * Retrieves a translated string for the given language and key.
 * @param {'en'|'ar'} lang - Language code.
 * @param {string} key - Translation key.
 * @param {string} [fallback=''] - Fallback string if key not found.
 * @returns {string} Translated string or fallback.
 */
function getTranslation(lang, key, fallback = "") {
  return translations[lang]?.[key] ?? fallback;
}

const EASTERN_ARABIC_DIGITS = [
  "٠",
  "١",
  "٢",
  "٣",
  "٤",
  "٥",
  "٦",
  "٧",
  "٨",
  "٩",
];

/**
 * Converts Western digits to Eastern Arabic numerals while preserving email addresses.
 * @param {string|number} str
 * @returns {string}
 */
function toArabicNumerals(str) {
  if (str === null || str === undefined) return "";
  const text = String(str);
  return text.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|(\d)/g,
    (match, digit) => {
      if (digit !== undefined) return EASTERN_ARABIC_DIGITS[Number(digit)];
      return match;
    },
  );
}

/**
 * Formats a number according to language, using Eastern Arabic numerals for 'ar'.
 * @param {number} val
 * @param {'en'|'ar'} lang
 * @returns {string}
 */
function formatCounterNumber(val, lang) {
  if (lang === "ar") {
    try {
      return val.toLocaleString("ar-EG");
    } catch {
      return toArabicNumerals(val.toLocaleString("en-US"));
    }
  }
  return val.toLocaleString("en-US");
}

/**
 * Updates the href of an SVG <use> element inside a button.
 * @param {HTMLElement|null} button - The button element.
 * @param {string} iconId - The SVG symbol ID (e.g. '#icon-moon').
 */
function setUseIcon(button, iconId) {
  const useNode = button?.querySelector("use");
  if (useNode) {
    useNode.setAttribute("href", iconId);
  }
}

/**
 * Updates the <meta name="theme-color"> to reflect the current theme and contrast state.
 */
function updateThemeColor() {
  if (!metaNodes.themeColor) {
    return;
  }

  const isHighContrast = root.dataset.contrast === "high";
  const isDark = root.dataset.theme === "dark";

  metaNodes.themeColor.setAttribute(
    "content",
    isHighContrast ? "#000000" : isDark ? "#3b82f6" : "#005f88",
  );
}

/**
 * Updates all SEO meta tags, Open Graph, Twitter card, and JSON-LD schema
 * to reflect the current language.
 * @param {'en'|'ar'} lang - Language code.
 */
function updateMetadata(lang) {
  const projectKey = document.body.dataset.projectKey;
  const projectTitle = projectKey
    ? getTranslation(lang, `${projectKey}_title`)
    : "";
  const title = projectTitle
    ? `${projectTitle} | ${lang === "ar" ? "ملف أعمال أحمد مهدي" : "Ahmed Mahdy Portfolio"}`
    : getTranslation(lang, "meta_title", document.title);
  const description = projectKey
    ? getTranslation(
        lang,
        `${projectKey}_sub`,
        metaNodes.description?.getAttribute("content") || "",
      )
    : getTranslation(
        lang,
        "meta_description",
        metaNodes.description?.getAttribute("content") || "",
      );

  document.title = title;
  metaNodes.description?.setAttribute("content", description);
  metaNodes.ogTitle?.setAttribute("content", title);
  metaNodes.ogDescription?.setAttribute("content", description);
  metaNodes.twitterTitle?.setAttribute("content", title);
  metaNodes.twitterDescription?.setAttribute("content", description);

  if (metaNodes.personSchema) {
    if (projectKey) {
      try {
        const schema = JSON.parse(metaNodes.personSchema.textContent);
        const entries = Array.isArray(schema) ? schema : [schema];
        const person = entries.find((entry) => entry["@type"] === "Person");
        const creativeWork = entries.find(
          (entry) => entry["@type"] === "CreativeWork",
        );
        const breadcrumbs = entries.find(
          (entry) => entry["@type"] === "BreadcrumbList",
        );

        if (person)
          person.jobTitle = getTranslation(lang, "title", person.jobTitle);
        if (creativeWork) {
          creativeWork.name = projectTitle;
          creativeWork.headline = projectTitle;
          creativeWork.description = description;
        }
        const lastBreadcrumb = breadcrumbs?.itemListElement?.at(-1);
        if (lastBreadcrumb) lastBreadcrumb.name = projectTitle;
        metaNodes.personSchema.textContent = JSON.stringify(entries, null, 2);
      } catch {
        // Keep the static project-specific schema when it cannot be parsed.
      }
    } else {
      metaNodes.personSchema.textContent = JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Ahmed Mahdy",
          jobTitle: getTranslation(
            lang,
            "title",
            "UX Designer & Data Visualizer",
          ),
          email: siteMeta.email,
          url: siteMeta.url,
          image: siteMeta.image,
          sameAs: siteMeta.sameAs,
          knowsAbout: siteMeta.knowsAbout,
        },
        null,
        2,
      );
    }
  }
}

/**
 * Replaces text content for all elements with [data-translate] attributes.
 * @param {'en'|'ar'} lang - Language code.
 */
function updateTranslatedText(lang) {
  document.querySelectorAll("[data-translate]").forEach((node) => {
    const key = node.dataset.translate;
    const value = getTranslation(lang, key);

    if (!value) return;
    const textNode = [...node.childNodes].find(
      (child) => child.nodeType === Node.TEXT_NODE,
    );
    if (textNode && node.children.length) textNode.textContent = `${value} `;
    else node.textContent = value;
  });
}

/**
 * Updates HTML attributes (e.g. aria-label) for elements with [data-translate-attr].
 * @param {'en'|'ar'} lang - Language code.
 */
function updateTranslatedAttributes(lang) {
  document.querySelectorAll("[data-translate-attr]").forEach((node) => {
    const attrName = node.dataset.translateAttr;
    const key = node.dataset.translateAttrKey;
    const value = getTranslation(lang, key);

    if (attrName && key && value) {
      node.setAttribute(attrName, value);
    }
  });
}

function getLinkText(link) {
  const note = link.querySelector(".sr-only[data-translate='opens_new_tab']");

  return Array.from(link.childNodes)
    .filter((node) => node !== note && !(node instanceof SVGElement))
    .map((node) => node.textContent)
    .join("")
    .trim();
}

/**
 * Adds an external-link cue and a visually-hidden new-tab note to every
 * target="_blank" link.
 * Idempotent — safe to call multiple times.
 * @param {'en'|'ar'} lang - Language code for the note text.
 */
function ensureExternalLinkNotes(lang) {
  const noteText = getTranslation(
    lang,
    "opens_new_tab",
    lang === "ar"
      ? " \u064a\u0641\u062a\u062d \u0641\u064a \u062a\u0628\u0648\u064a\u0628 \u062c\u062f\u064a\u062f"
      : " opens in new tab",
  );

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    link.rel = "noopener noreferrer";

    let note = link.querySelector(".sr-only[data-translate='opens_new_tab']");

    if (!note) {
      note = document.createElement("span");
      note.className = "sr-only";
      note.dataset.translate = "opens_new_tab";
      link.appendChild(note);
    }

    if (
      !link.closest(".footer-social-icons, .contact-list") &&
      !link.querySelector(
        'use[href="#icon-external"], use[href="#icon-arrow-up-right"]',
      )
    ) {
      const icon = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");

      icon.classList.add("external-icon");
      icon.setAttribute("aria-hidden", "true");
      use.setAttribute("href", "#icon-external");
      icon.appendChild(use);
      link.insertBefore(icon, note);
    }

    note.textContent = noteText;
  });
}

/**
 * Refreshes aria-label and title attributes on all external links to include
 * the translated "opens external site" hint and "opens in new tab" note.
 * Also calls ensureExternalLinkNotes to guarantee the SR-only span is present.
 * @param {'en'|'ar'} lang - Language code.
 */
function updateExternalLinks(lang) {
  const hint = getTranslation(lang, "external_site_hint");
  const newTabText = getTranslation(
    lang,
    "opens_new_tab",
    lang === "ar"
      ? "\u064a\u0641\u062a\u062d \u0641\u064a \u062a\u0628\u0648\u064a\u0628 \u062c\u062f\u064a\u062f"
      : "opens in new tab",
  ).trim();

  ensureExternalLinkNotes(lang);

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    let label = getLinkText(link);
    if (!label) {
      const equivalent = [...document.querySelectorAll("a[href]")].find(
        (candidate) =>
          candidate !== link &&
          candidate.href === link.href &&
          getLinkText(candidate),
      );
      if (equivalent) label = getLinkText(equivalent);
    }
    if (!label) {
      const article = link.closest("article");
      const projectTitle = article?.querySelector("h3")?.textContent?.trim();
      const fallbackKey = link.dataset.tooltipKey;
      const baseLabel = fallbackKey
        ? getTranslation(lang, fallbackKey, "Visit live site")
        : "Visit live site";
      label = projectTitle ? `${baseLabel}: ${projectTitle}` : baseLabel;
    }
    const context = [hint, newTabText].filter(Boolean).join(", ");

    link.setAttribute("aria-label", context ? `${label} (${context})` : label);
    link.setAttribute("title", context || label);

    if (link.dataset.tooltipKey) {
      link.setAttribute(
        "data-tooltip",
        getTranslation(
          lang,
          link.dataset.tooltipKey,
          link.getAttribute("data-tooltip") || "",
        ),
      );
    }
  });
}

/**
 * Updates aria-label and data-tooltip on all copy buttons to match
 * the current language.
 * @param {'en'|'ar'} lang - Language code.
 */
function updateCopyButtons(lang) {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    const key = button.dataset.tooltipKey;
    const genericLabel = getTranslation(
      lang,
      key,
      button.getAttribute("aria-label") || "",
    );
    const container = button.closest("li, article");
    const link =
      container?.querySelector("h3 a, h4 a") || container?.querySelector("a");
    const includesSubject =
      key === "tooltip_copy_cert" || key === "tooltip_copy_project";
    const subject = includesSubject && link ? getLinkText(link) : "";
    const label = subject ? `${genericLabel}: ${subject}` : genericLabel;

    if (label) {
      button.setAttribute("aria-label", label);
      button.setAttribute("data-tooltip", genericLabel);
    }
  });
}

/**
 * Updates the language toggle button aria-label and tooltip to indicate
 * which language it will switch to.
 * @param {'en'|'ar'} lang - The currently active language.
 */
function updateLanguageButton(lang) {
  const nextLanguageLabel =
    lang === "ar"
      ? getTranslation(lang, "aria_switch_to_english")
      : getTranslation(lang, "aria_switch_to_arabic");

  document.querySelectorAll(".lang-toggle").forEach((button) => {
    button.setAttribute("aria-label", nextLanguageLabel);
    button.setAttribute("data-tooltip", getTranslation(lang, "tooltip_lang"));
    const label = button.querySelector(".control-state");
    if (label) label.setAttribute("lang", lang === "ar" ? "en" : "ar");
  });

  document.querySelectorAll(".language-option-input").forEach((input) => {
    input.checked = input.value === lang;
  });
}

/**
 * Updates the theme switch icon, label, checked state, and tooltip
 * to reflect the current theme state.
 * @param {'en'|'ar'} lang - Language code for translated labels.
 */
function updateThemeButton(lang, targetTheme) {
  const isDark = (targetTheme || root.dataset.theme) === "dark";
  const tooltip = isDark
    ? getTranslation(lang, "tooltip_theme_light")
    : getTranslation(lang, "tooltip_theme_dark");

  document.querySelectorAll(".theme-toggle").forEach((toggle) => {
    toggle.setAttribute("aria-label", getTranslation(lang, "aria_dark_mode"));
    if (toggle.querySelector(".control-switch")) {
      toggle.setAttribute("role", "switch");
      toggle.setAttribute("aria-checked", String(isDark));
      toggle.removeAttribute("aria-pressed");
    } else {
      toggle.setAttribute("aria-pressed", String(isDark));
    }
    toggle.setAttribute("data-tooltip", tooltip);
    const state = toggle.querySelector(".control-state");
    if (state)
      state.textContent = getTranslation(
        lang,
        isDark ? "control_on" : "control_off",
      );
    setUseIcon(toggle, isDark ? "#icon-sun" : "#icon-moon");
  });
}

/**
 * Updates the contrast switch label, checked state, tooltip,
 * and active class to reflect the current contrast state.
 * @param {'en'|'ar'} lang - Language code for translated labels.
 * @param {'normal'|'high'} [targetContrast] - Optional explicit target contrast.
 */
function updateContrastButton(lang, targetContrast) {
  const isHigh = (targetContrast || root.dataset.contrast) === "high";

  document.querySelectorAll(".contrast-toggle").forEach((toggle) => {
    toggle.setAttribute(
      "aria-label",
      getTranslation(lang, "aria_high_contrast_mode"),
    );
    if (toggle.querySelector(".control-switch")) {
      toggle.setAttribute("role", "switch");
      toggle.setAttribute("aria-checked", String(isHigh));
      toggle.removeAttribute("aria-pressed");
    } else {
      toggle.setAttribute("aria-pressed", String(isHigh));
    }
    toggle.setAttribute(
      "data-tooltip",
      getTranslation(lang, "tooltip_contrast"),
    );
    toggle.classList.toggle("active", isHigh);
    const state = toggle.querySelector(".control-state");
    if (state)
      state.textContent = getTranslation(
        lang,
        isHigh ? "control_on" : "control_off",
      );
  });
}

/**
 * Updates aria-label on all collapsible project card toggle buttons to match
 * current language and expansion state.
 * @param {'en'|'ar'} lang - Language code.
 */
/**
 * Orchestrates a full UI refresh for a language switch or initial load.
 * Runs all translation, metadata, link, button, and aria-label update functions.
 * @param {'en'|'ar'} lang - Language code to apply.
 */
function refreshUi(lang) {
  const isPreRendered = document.body.dataset.staticLocale === lang;
  if (!isPreRendered && document.body.dataset.localized !== "false") {
    updateTranslatedText(lang);
    updateTranslatedAttributes(lang);
    updateMetadata(lang);
  }
  updateExternalLinks(lang);
  updateCopyButtons(lang);
  updateLanguageButton(lang);
  updateThemeButton(lang);
  updateContrastButton(lang);
  document.querySelectorAll("[data-print-resume]").forEach((button) => {
    const label =
      lang === "ar" ? "طباعة أو حفظ السيرة الذاتية" : "Print or save résumé";
    button.setAttribute("aria-label", label);
    button.setAttribute("data-tooltip", label);
  });
  document
    .querySelectorAll(".audio-play-btn:not(.is-playing)")
    .forEach((button) => {
      const section = button
        .closest(".panel")
        ?.querySelector("h2")
        ?.textContent.trim();
      const label =
        translations[lang][
          button.classList.contains("case-listen-btn")
            ? "cs_listen_full"
            : "cs_listen"
        ];
      button.setAttribute(
        "aria-label",
        section ? `${label}: ${section}` : label,
      );
      button.setAttribute("title", label);
    });
  document.querySelectorAll('.skills-panel [role="list"]').forEach((list) => {
    const heading = list
      .closest(".skill-group")
      ?.querySelector("h3")?.textContent;
    if (heading) list.setAttribute("aria-label", heading);
  });
  const backToTop = document.querySelector(".back-to-top-fab");
  if (backToTop) {
    const label = translations[lang].back_to_top;
    backToTop.setAttribute("aria-label", label);
    backToTop.setAttribute("title", label);
  }
  document.querySelectorAll("[data-counter-target]").forEach((el) => {
    const target = Number.parseInt(
      el.getAttribute("data-counter-target") || "0",
      10,
    );
    if (Number.isNaN(target)) return;
    if (el.dataset.animated === "true") {
      el.textContent = formatCounterNumber(target, lang);
    } else {
      el.textContent = lang === "ar" ? "٠" : "0";
    }
  });
  refreshCaseSectionJump(lang);
  window.AntigravityAudio?.refreshLabels?.();
}

/**
 * Applies a theme, persists it to localStorage, and refreshes the UI.
 * @param {'light'|'dark'} theme - Theme name to apply.
 */
function setTheme(theme, immediate = false) {
  const previousTheme = root.dataset.theme;
  window.resumePreferences.set(storageKeys.theme, theme);
  updateThemeButton(getCurrentLanguage(), theme);

  const applyTheme = () => {
    if (root.dataset.theme !== theme) {
      root.dataset.theme = theme;
    }
    updateThemeColor();
  };

  if (
    immediate ||
    previousTheme === theme ||
    typeof requestAnimationFrame !== "function"
  ) {
    applyTheme();
  } else {
    requestAnimationFrame(applyTheme);
  }
}

/**
 * Applies a contrast mode, persists it to localStorage, and refreshes the UI.
 * @param {'normal'|'high'} contrast - Contrast level to apply.
 * @param {boolean} [immediate=false] - Apply immediately without requestAnimationFrame.
 */
function setContrast(contrast, immediate = false) {
  const previousContrast = root.dataset.contrast;
  window.resumePreferences.set(storageKeys.contrast, contrast);
  updateContrastButton(getCurrentLanguage(), contrast);

  const applyContrast = () => {
    if (root.dataset.contrast !== contrast) {
      root.dataset.contrast = contrast;
    }
    updateThemeColor();
  };

  if (
    immediate ||
    previousContrast === contrast ||
    typeof requestAnimationFrame !== "function"
  ) {
    applyContrast();
  } else {
    requestAnimationFrame(applyContrast);
  }
}

/**
 * Switches the active language: updates the html element's lang/dir attributes,
 * persists the choice to localStorage, and runs a full UI refresh.
 * @param {'en'|'ar'} lang - Language code to activate.
 */
function setLanguage(lang, persist = true, isUserAction = false) {
  const staticLocale = document.body.dataset.staticLocale;
  if (isUserAction && persist && staticLocale && lang !== staticLocale) {
    window.resumePreferences.set(storageKeys.lang, lang);
    const hash = location.hash || "";
    location.assign(
      `/${lang}${document.body.dataset.staticPath || "/"}${hash}`,
    );
    return;
  }
  root.setAttribute("lang", lang);
  root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  if (persist) window.resumePreferences.set(storageKeys.lang, lang);
  refreshUi(lang);
}

/**
 * Copies a string to the clipboard using the Clipboard API when available,
 * with a textarea execCommand fallback for non-secure contexts.
 * Restores focus and selection state after the fallback path.
 * @param {string} value - The text to copy.
 * @returns {Promise<void>}
 * @throws {Error} If the fallback copy command fails.
 */
async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  const selection = window.getSelection();
  const activeElement = document.activeElement;
  const originalRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";

  document.body.appendChild(textarea);
  textarea.focus({ preventScroll: true });
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;

  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);

    if (activeElement instanceof HTMLElement) {
      activeElement.focus();
    }

    if (selection) {
      selection.removeAllRanges();
      if (originalRange) {
        selection.addRange(originalRange);
      }
    }
  }

  if (!copied) {
    throw new Error("copy command unsuccessful");
  }
}

/**
 * Displays a live-region toast notification for the given message.
 * Auto-dismisses after 5 seconds. Resets the timer if called while visible.
 * @param {string} message - The message text to display.
 */
function showToast(message) {
  window.clearTimeout(toastTimer);
  copyToast.textContent = message;
  copyToast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    copyToast.classList.remove("is-visible");
  }, 5000);
}

/**
 * Creates a fully accessible copy button element with icon, aria-label, and tooltip.
 * @param {string} value - The text value to copy on click.
 * @param {string} label - The initial aria-label / tooltip string.
 * @param {string} key - The translation key used to update the label on language switch.
 * @returns {HTMLButtonElement} The constructed button element.
 */
function createCopyButton(value, label, key) {
  const button = document.createElement("button");
  const iconWrapper = document.createElement("span");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");

  button.className = "copy-button";
  button.type = "button";
  button.dataset.copy = value;
  button.dataset.tooltipKey = key;
  button.setAttribute("aria-label", label);
  button.setAttribute("data-tooltip", label);

  iconWrapper.setAttribute("aria-hidden", "true");
  use.setAttribute("href", "#icon-copy");
  svg.appendChild(use);
  iconWrapper.appendChild(svg);
  button.appendChild(iconWrapper);

  return button;
}

/**
 * Dynamically injects a share/copy button into project cards and makes the
 * whole card clickable (excluding the link and button themselves).
 * Certifications deliberately carry credential metadata instead of a copy
 * button — nobody copies a certificate name, and five of them turned the
 * panel into noise.
 * Safe to call multiple times — skips cards that already have a copy button.
 */
function enhanceLinkedCards() {
  document.querySelectorAll(".featured h3 a").forEach((link) => {
    const container = link.closest("article");

    if (!container || container.querySelector(".copy-button")) {
      return;
    }

    const tooltipKey = "tooltip_copy_project";
    const baseLabel = getTranslation(getCurrentLanguage(), tooltipKey);
    const projectName = link.textContent.trim();
    const label = projectName ? `${baseLabel}: ${projectName}` : baseLabel;
    const copyButton = createCopyButton(link.href, label, tooltipKey);

    container.appendChild(copyButton);
    container.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) {
        return;
      }

      link.click();
    });
  });

  document.querySelectorAll(".compact-list li").forEach((item) => {
    const link = item.querySelector("a");

    if (!link || item.dataset.cardBound === "true") {
      return;
    }

    item.dataset.cardBound = "true";
    item.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) {
        return;
      }

      link.click();
    });
  });
}

/**
 * Attaches click event listeners to all [data-copy] buttons.
 * Uses a data-copy-bound guard to prevent duplicate bindings.
 * Shows a contextual toast and temporarily swaps the icon on success.
 */
function bindCopyButtons() {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    if (button.dataset.copyBound === "true") {
      return;
    }

    button.dataset.copyBound = "true";
    button.addEventListener("click", async (event) => {
      event.stopPropagation();

      const lang = getCurrentLanguage();

      try {
        await copyText(button.dataset.copy);
        const toastKey = button.dataset.tooltipKey
          ? button.dataset.tooltipKey.replace("tooltip_copy_", "toast_copy_")
          : "";
        const toastMessage = getTranslation(
          lang,
          toastKey,
          getTranslation(lang, "toast_copied"),
        );

        showToast(toastMessage);

        setUseIcon(button, "#icon-check");
        button.classList.add("copied");

        window.setTimeout(() => {
          setUseIcon(button, "#icon-copy");
          button.classList.remove("copied");
        }, 1500);
      } catch {
        showToast(
          `${getTranslation(lang, "toast_failed")} ${button.dataset.copy}`,
        );
      }
    });
  });
}

/**
 * Normalises text in the printable résumé document and updates aria-labels
 * on the print button. The @page header/footer content is declared statically
 * in print.css to avoid CSP violations on the production site.
 */
function updatePrintStyles() {
  const printDocument = document.querySelector(".print-resume-document");
  if (printDocument) {
    const walker = document.createTreeWalker(
      printDocument,
      NodeFilter.SHOW_TEXT,
    );
    let node = walker.nextNode();
    while (node) {
      node.nodeValue = node.nodeValue.replace(/\s*[–—·]\s*/g, " - ");
      node = walker.nextNode();
    }
  }
}

/**
 * Entry point. Enhances cards with copy buttons, binds all copy button
 * listeners, then applies the saved (or system-preferred) theme, contrast,
 * and language to boot the UI.
 */
/**
 * Initializes a smooth reading progress bar for case study pages.
 */
function initReadingProgressBar() {
  if (!document.querySelector(".case-study-card")) return;

  let bar = document.querySelector(".reading-progress-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.className = "reading-progress-bar";
    bar.setAttribute("aria-hidden", "true");
    document.body.prepend(bar);
  }

  let ticking = false;
  const updateProgress = () => {
    const totalHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight > 0) {
      const progress = Math.min(Math.max(window.scrollY / totalHeight, 0), 1);
      bar.style.transform = `scaleX(${progress})`;
      const navFill = document.getElementById("case-reading-progress");
      if (navFill) {
        navFill.style.transform = `scaleX(${progress})`;
      }
    }
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    },
    { passive: true },
  );

  updateProgress();
}

/** Keeps a reachable route back to the page heading once the first view is left. */
function initBackToTop() {
  const main = document.getElementById("main-content");
  if (!main) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "back-to-top-fab";
  button.hidden = true;
  button.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.append(button);

  let ticking = false;
  const update = () => {
    button.hidden = window.scrollY < Math.min(520, window.innerHeight * 0.72);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      requestAnimationFrame(update);
      ticking = true;
    },
    { passive: true },
  );

  button.addEventListener("click", () => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
    window.setTimeout(
      () => {
        main.setAttribute("tabindex", "-1");
        main.focus({ preventScroll: true });
        main.addEventListener("blur", () => main.removeAttribute("tabindex"), {
          once: true,
        });
      },
      reducedMotion ? 0 : 350,
    );
  });

  update();
}

function initResumeDownloadMenu() {
  const menu = document.querySelector(".resume-download-menu");
  if (!(menu instanceof HTMLDetailsElement)) return;

  document.addEventListener("click", (event) => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });

  menu.addEventListener("focusout", (event) => {
    if (!menu.contains(event.relatedTarget)) menu.open = false;
  });

  menu.addEventListener("keydown", (event) => {
    const items = [
      ...menu.querySelectorAll(
        ".resume-download-options > a, .resume-download-options > button",
      ),
    ];
    const index = items.indexOf(document.activeElement);
    if (event.key === "Escape") {
      menu.open = false;
      menu.querySelector("summary")?.focus();
      return;
    }
    if (
      event.target === menu.querySelector("summary") &&
      ["ArrowDown", "ArrowUp"].includes(event.key)
    ) {
      event.preventDefault();
      menu.open = true;
      items[event.key === "ArrowDown" ? 0 : items.length - 1]?.focus();
      return;
    }
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowDown"
            ? Math.min(items.length - 1, index + 1)
            : event.key === "ArrowUp"
              ? Math.max(0, index - 1)
              : -1;
    if (next >= 0) {
      event.preventDefault();
      items[next]?.focus();
    }
  });
}

let selectMenuId = 0;

/**
 * Adds a consistently styled listbox while retaining the native select as the
 * no-JavaScript fallback and source of truth.
 */
function enhanceSelect(select) {
  if (!(select instanceof HTMLSelectElement) || select.dataset.enhanced) return;
  select.dataset.enhanced = "true";
  select.classList.add("enhanced-select-native");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");

  const shell = document.createElement("span");
  shell.className = "select-menu";
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "select-menu-trigger";
  trigger.id = `select-menu-trigger-${++selectMenuId}`;
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  const value = document.createElement("span");
  value.className = "select-menu-value";
  const chevron = document.createElement("span");
  chevron.className = "select-menu-chevron";
  chevron.setAttribute("aria-hidden", "true");
  trigger.append(value, chevron);

  const list = document.createElement("span");
  list.className = "select-menu-list";
  list.id = `select-menu-options-${selectMenuId}`;
  list.setAttribute("role", "listbox");
  list.hidden = true;
  trigger.setAttribute("aria-controls", list.id);
  shell.append(trigger, list);
  select.after(shell);
  const owningLabel = select.closest("label");
  if (owningLabel) owningLabel.htmlFor = trigger.id;
  shell.parentElement?.querySelector(":scope > svg")?.remove();
  const labelNode = owningLabel?.querySelector(":scope > span");

  const labelText = () =>
    labelNode?.textContent?.trim() ||
    select.getAttribute("aria-label") ||
    "Select";
  const options = () => [...list.querySelectorAll('[role="option"]')];
  const close = ({ restoreFocus = false } = {}) => {
    list.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    shell.classList.remove("is-open");
    if (restoreFocus) trigger.focus();
  };
  const open = () => {
    list.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    shell.classList.add("is-open");
    (
      options().find(
        (option) => option.getAttribute("aria-selected") === "true",
      ) || options()[0]
    )?.focus();
  };
  const choose = (option) => {
    select.value = option.dataset.value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    sync();
    close({ restoreFocus: true });
  };
  const sync = () => {
    list.replaceChildren();
    list.setAttribute("aria-label", labelText());
    for (const nativeOption of select.options) {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "select-menu-option";
      option.dataset.value = nativeOption.value;
      option.setAttribute("role", "option");
      option.setAttribute(
        "aria-selected",
        String(nativeOption.value === select.value),
      );
      option.textContent = nativeOption.textContent;
      option.addEventListener("click", () => choose(option));
      list.append(option);
    }
    const selected = select.selectedOptions[0];
    value.textContent = selected?.textContent || "";
    trigger.setAttribute("aria-label", `${labelText()}: ${value.textContent}`);
  };

  trigger.addEventListener("click", () =>
    trigger.getAttribute("aria-expanded") === "true" ? close() : open(),
  );
  shell.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close({ restoreFocus: true });
      return;
    }
    if (
      event.target === trigger &&
      ["ArrowDown", "ArrowUp"].includes(event.key)
    ) {
      event.preventDefault();
      open();
      return;
    }
    const items = options();
    const index = items.indexOf(document.activeElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : event.key === "ArrowDown"
            ? Math.min(items.length - 1, index + 1)
            : event.key === "ArrowUp"
              ? Math.max(0, index - 1)
              : -1;
    if (next >= 0) {
      event.preventDefault();
      items[next]?.focus();
      return;
    }
    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      const match = items.find((item) =>
        item.textContent
          .trim()
          .toLocaleLowerCase()
          .startsWith(event.key.toLocaleLowerCase()),
      );
      match?.focus();
    }
  });
  document.addEventListener("pointerdown", (event) => {
    if (!shell.contains(event.target)) close();
  });
  shell.addEventListener("focusout", () => {
    requestAnimationFrame(() => {
      if (!shell.contains(document.activeElement)) close();
    });
  });
  select.addEventListener("change", sync);
  select.addEventListener("selectoptionschange", sync);
  if (labelNode)
    new MutationObserver(sync).observe(labelNode, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  sync();
}

window.enhanceSelect = enhanceSelect;

function initSelectEnhancements() {
  document.querySelectorAll("select").forEach(enhanceSelect);
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches("select")) enhanceSelect(node);
        node.querySelectorAll("select").forEach(enhanceSelect);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}

function initialize() {
  initResponsiveContentOrder();
  initSectionNavigation();
  initCaseSectionNavigation();
  initSelectEnhancements();
  enhanceLinkedCards();
  bindCopyButtons();
  bindSectionCopyButtons();
  initReadingProgressBar();
  initBackToTop();
  initResumeDownloadMenu();
  initCertLightbox();

  setTheme(savedTheme || (prefersDark ? "dark" : "light"));
  setContrast(savedContrast);
  setLanguage(savedLang, true);
}

function refreshCaseSectionJump(_lang) {
  const nav = document.querySelector(".case-section-nav");
  const activeLink = nav?.querySelector(".case-section-link.is-active");
  const indicator = nav?.querySelector(".case-section-indicator");
  if (activeLink && indicator) {
    requestAnimationFrame(() => {
      const x = activeLink.offsetLeft;
      const y = activeLink.offsetTop;
      const w = activeLink.offsetWidth;
      const h = activeLink.offsetHeight;
      indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      indicator.style.width = `${w}px`;
      indicator.style.height = `${h}px`;
    });
  }
}

function initCaseSectionNavigation() {
  const nav = document.querySelector(".case-section-nav");
  const sentinel = document.getElementById("case-nav-sentinel");
  if (nav && sentinel && "IntersectionObserver" in window) {
    const stickyObserver = new IntersectionObserver(
      ([entry]) => {
        nav.classList.toggle("is-stuck", !entry.isIntersecting);
      },
      { threshold: [0], rootMargin: "-12px 0px 0px 0px" },
    );
    stickyObserver.observe(sentinel);
  }

  const links = [
    ...(nav?.querySelectorAll('.case-section-link[href^="#"]') || []),
  ];
  if (!nav || !links.length) return;

  let indicator = nav.querySelector(".case-section-indicator");
  if (!indicator) {
    indicator = document.createElement("span");
    indicator.className = "case-section-indicator";
    indicator.setAttribute("aria-hidden", "true");
    nav.appendChild(indicator);
  }
  nav.classList.add("has-indicator");

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let isUserClick = false;
  let clickTimeout = 0;
  let moveFrame = 0;

  function moveIndicatorTo(targetLink, immediate = false) {
    if (!targetLink || !indicator) return;
    cancelAnimationFrame(moveFrame);
    moveFrame = requestAnimationFrame(() => {
      const x = targetLink.offsetLeft;
      const y = targetLink.offsetTop;
      const w = targetLink.offsetWidth;
      const h = targetLink.offsetHeight;

      if (immediate || prefersReducedMotion()) {
        indicator.style.transition = "none";
      } else {
        indicator.style.transition = "";
      }

      indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      indicator.style.width = `${w}px`;
      indicator.style.height = `${h}px`;
      indicator.style.opacity = "1";

      if (immediate) {
        requestAnimationFrame(() => {
          indicator.style.transition = "";
        });
      }
    });
  }

  const getActiveLink = () =>
    nav.querySelector('.case-section-link.is-active[href^="#"]') || links[0];

  const setCurrent = (hash) => {
    let matchedLink = null;
    links.forEach((link) => {
      const match = link.hash === hash;
      link.classList.toggle("is-active", match);
      if (match) {
        link.setAttribute("aria-current", "location");
        matchedLink = link;
      } else {
        link.removeAttribute("aria-current");
      }
    });
    if (matchedLink) {
      moveIndicatorTo(matchedLink);
    }
  };

  links.forEach((link) => {
    link.addEventListener("click", () => {
      isUserClick = true;
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        isUserClick = false;
      }, 900);
      const target = document.querySelector(link.hash);
      if (target instanceof HTMLDetailsElement) target.open = true;
      setCurrent(link.hash);
      moveIndicatorTo(link);
    });
    link.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      moveIndicatorTo(link);
    });
  });

  nav.addEventListener("pointerleave", () => {
    moveIndicatorTo(getActiveLink());
  });

  window.addEventListener(
    "resize",
    () => {
      moveIndicatorTo(getActiveLink(), true);
    },
    { passive: true },
  );

  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => {
      moveIndicatorTo(getActiveLink(), true);
    });
    ro.observe(nav);
  }

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isUserClick) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setCurrent(`#${visible.target.id}`);
      },
      { rootMargin: "-20% 0px -65%", threshold: [0, 0.1, 0.5] },
    );
    links.forEach((link) => {
      const target = document.querySelector(link.hash);
      if (target) observer.observe(target);
    });
  }
  setCurrent(links[0].hash);
  requestAnimationFrame(() => {
    moveIndicatorTo(getActiveLink(), true);
  });
}

function initSectionNavigation() {
  const nav = document.querySelector(".section-nav");
  const sentinel = document.getElementById("nav-sentinel");
  if (nav && sentinel && "IntersectionObserver" in window) {
    const stickyObserver = new IntersectionObserver(
      ([entry]) => {
        nav.classList.toggle("is-stuck", !entry.isIntersecting);
      },
      { threshold: [0], rootMargin: "-12px 0px 0px 0px" },
    );
    stickyObserver.observe(sentinel);
  }

  const links = [...document.querySelectorAll('.section-nav a[href^="#"]')];
  const targets = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);
  if (!links.length || !nav) return;

  let indicator = nav.querySelector(".section-nav-indicator");
  if (!indicator) {
    indicator = document.createElement("span");
    indicator.className = "section-nav-indicator";
    indicator.setAttribute("aria-hidden", "true");
    nav.appendChild(indicator);
  }
  nav.classList.add("has-indicator");

  const prefersReducedMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let isUserClick = false;
  let clickTimeout = 0;
  let moveFrame = 0;

  function moveIndicatorTo(targetLink, immediate = false) {
    if (!targetLink || !indicator) return;
    cancelAnimationFrame(moveFrame);
    moveFrame = requestAnimationFrame(() => {
      const x = targetLink.offsetLeft;
      const y = targetLink.offsetTop;
      const w = targetLink.offsetWidth;
      const h = targetLink.offsetHeight;

      if (immediate || prefersReducedMotion()) {
        indicator.style.transition = "none";
      } else {
        indicator.style.transition = "";
      }

      indicator.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      indicator.style.width = `${w}px`;
      indicator.style.height = `${h}px`;
      indicator.style.opacity = "1";

      if (immediate) {
        requestAnimationFrame(() => {
          indicator.style.transition = "";
        });
      }
    });
  }

  const getActiveLink = () =>
    nav.querySelector('.section-nav a.active[href^="#"]') || links[0];

  const setCurrent = (id) => {
    let matchedLink = null;
    for (const link of links) {
      const match = link.getAttribute("href") === `#${id}`;
      if (match) {
        link.setAttribute("aria-current", "location");
        link.classList.add("active");
        matchedLink = link;
      } else {
        link.removeAttribute("aria-current");
        link.classList.remove("active");
      }
    }
    if (matchedLink) {
      moveIndicatorTo(matchedLink);
    }
  };

  if (targets.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (isUserClick) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setCurrent(visible.target.id);
      },
      { rootMargin: "-20% 0px -65%", threshold: [0, 0.1, 0.5] },
    );
    for (const target of targets) {
      observer.observe(target);
    }
  }

  for (const link of links) {
    link.addEventListener("click", () => {
      isUserClick = true;
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        isUserClick = false;
      }, 900);
      setCurrent(link.hash.slice(1));
      moveIndicatorTo(link);
    });
    link.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch") return;
      moveIndicatorTo(link);
    });
  }

  nav.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "touch") return;
    moveIndicatorTo(getActiveLink());
  });

  nav.addEventListener(
    "scroll",
    () => {
      moveIndicatorTo(getActiveLink(), true);
    },
    { passive: true },
  );

  window.addEventListener(
    "resize",
    () => {
      moveIndicatorTo(getActiveLink(), true);
    },
    { passive: true },
  );

  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => {
      moveIndicatorTo(getActiveLink(), true);
    });
    ro.observe(nav);
  }

  moveIndicatorTo(getActiveLink(), true);
}

function initResponsiveContentOrder() {
  const content = document.querySelector(".content-grid");
  const sidebar = content?.querySelector(".sidebar");
  const mainColumn = content?.querySelector(".main-column");
  const sections = Object.fromEntries(
    [
      "projects",
      "employment",
      "about",
      "skills",
      "education",
      "certifications",
    ].map((id) => [id, document.getElementById(id)]),
  );
  if (
    !content ||
    !sidebar ||
    !mainColumn ||
    Object.values(sections).some((section) => !section)
  )
    return;

  const narrow = window.matchMedia("(max-width: 880px)");
  const applyOrder = () => {
    if (narrow.matches) {
      content.append(mainColumn, sidebar);
      mainColumn.append(sections.projects, sections.employment);
      sidebar.append(
        sections.about,
        sections.skills,
        sections.education,
        sections.certifications,
      );
    } else {
      content.append(sidebar, mainColumn);
      sidebar.append(sections.about, sections.certifications, sections.skills);
      mainColumn.append(
        sections.projects,
        sections.employment,
        sections.education,
      );
    }
  };

  applyOrder();
  narrow.addEventListener("change", applyOrder);
}

document.querySelectorAll(".theme-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });
});

document.querySelectorAll(".contrast-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    setContrast(root.dataset.contrast === "high" ? "normal" : "high");
  });
});

document.querySelectorAll(".lang-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    window.AntigravityAudio?.stop();
    setLanguage(getCurrentLanguage() === "ar" ? "en" : "ar", true, true);
  });
});

document.querySelectorAll(".language-option-input").forEach((input) => {
  input.addEventListener("change", () => {
    if (!input.checked || !["en", "ar"].includes(input.value)) return;
    window.AntigravityAudio?.stop();
    setLanguage(input.value, true, true);
  });
});

document.querySelectorAll("[data-print-resume]").forEach((button) => {
  button.addEventListener("click", () => window.print());
});

window.addEventListener("beforeprint", updatePrintStyles);

// Dismiss help without losing the user's place in the keyboard sequence.
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll("[data-tooltip]").forEach((element) => {
    element.dataset.tooltipDismissed = "true";
  });
});
for (const eventName of ["pointerover", "focusin"]) {
  document.addEventListener(eventName, (event) => {
    const trigger = event.target.closest?.("[data-tooltip]");
    if (trigger && !trigger.contains(event.relatedTarget)) {
      delete trigger.dataset.tooltipDismissed;
    }
  });
}

initialize();

/* ── Interactive Image Lightbox Modal ── */
function initImageLightbox() {
  let lightbox = null;
  let lightboxImg = null;
  let lightboxCaption = null;
  let closeBtn = null;
  let lastActiveElement = null;

  function ensureLightbox() {
    if (lightbox) return;
    lightbox = document.getElementById("image-lightbox");
    if (!lightbox) {
      lightbox = document.createElement("dialog");
      lightbox.id = "image-lightbox";
      lightbox.className = "image-lightbox";
      lightbox.setAttribute(
        "aria-label",
        getTranslation(getCurrentLanguage(), "cs_image_preview"),
      );
      lightbox.innerHTML = `
        <div class="lightbox-content">
          <button class="lightbox-close-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <div class="lightbox-img-wrapper">
            <img class="lightbox-img" alt="" />
          </div>
          <p class="lightbox-caption"></p>
        </div>
      `;
      document.body.appendChild(lightbox);
    }
    let wrapper = lightbox.querySelector(".lightbox-img-wrapper");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.className = "lightbox-img-wrapper";
      lightbox.querySelector(".lightbox-content")?.appendChild(wrapper);
    }
    lightboxImg = lightbox.querySelector(".lightbox-img");
    if (!lightboxImg) {
      lightboxImg = document.createElement("img");
      lightboxImg.className = "lightbox-img";
      lightboxImg.alt = "";
      wrapper.appendChild(lightboxImg);
    }
    lightboxCaption = lightbox.querySelector(".lightbox-caption");
    closeBtn = lightbox.querySelector(".lightbox-close-btn");
    closeBtn?.setAttribute(
      "aria-label",
      getTranslation(getCurrentLanguage(), "cs_close_image_preview"),
    );

    closeBtn?.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (
        e.target === lightbox ||
        e.target.classList.contains("lightbox-img-wrapper")
      ) {
        closeLightbox();
      }
    });

    lightbox.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeLightbox();
    });
    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        closeBtn?.focus({ preventScroll: true });
      }
    });
    lightbox.addEventListener("close", restoreLightboxState);
  }

  function openLightbox(imgSrc, altText, captionText) {
    ensureLightbox();
    lastActiveElement = document.activeElement;
    lightboxImg.src = imgSrc;
    lightboxImg.alt = altText || "";
    if (lightboxCaption) {
      lightboxCaption.textContent = captionText || altText || "";
    }
    lightbox.setAttribute(
      "aria-label",
      getTranslation(getCurrentLanguage(), "cs_image_preview"),
    );
    closeBtn?.setAttribute(
      "aria-label",
      getTranslation(getCurrentLanguage(), "cs_close_image_preview"),
    );
    lightbox.showModal();
    closeBtn?.focus({ preventScroll: true });
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox?.open) return;
    lightbox.close();
  }

  function restoreLightboxState() {
    document.body.style.overflow = "";
    if (lightboxImg) {
      lightboxImg.src =
        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
    }
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
      lastActiveElement.focus();
    }
  }

  // Attach to case study images
  const targetImages = document.querySelectorAll(
    ".case-study-image, .case-showcase-wrapper img",
  );
  targetImages.forEach((img) => {
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute(
      "aria-label",
      `${getTranslation(getCurrentLanguage(), "cs_zoom_image")}: ${img.alt || getTranslation(getCurrentLanguage(), "cs_image_preview")}`,
    );

    const handleOpen = () => {
      if (!img.naturalWidth && !img.currentSrc && !img.src) return;
      const bestSrc = img.currentSrc || img.src;
      const caption =
        img.closest("figure")?.querySelector("figcaption")?.textContent ||
        img.alt;
      openLightbox(bestSrc, img.alt, caption);
    };

    img.addEventListener("click", handleOpen);
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpen();
      }
    });
  });

  const zoomTriggers = document.querySelectorAll(".case-image-zoom-trigger");
  zoomTriggers.forEach((trigger) => {
    const img = trigger.querySelector("img");
    if (!img) return;
    trigger.addEventListener("click", (e) => {
      if (e.target === img) return;
      const bestSrc = img.currentSrc || img.src;
      const caption =
        trigger.closest("figure")?.querySelector("figcaption")?.textContent ||
        img.alt;
      openLightbox(bestSrc, img.alt, caption);
    });
  });
}

/* ── Interactive In-Page Live Embed Viewer ── */
function initLiveEmbedViewer() {
  const viewer = document.getElementById("live-embed-viewer");
  if (viewer) {
    const help = document.createElement("p");
    help.className = "embed-help";
    help.dataset.translate = "cs_preview_help";
    help.textContent = getTranslation(getCurrentLanguage(), "cs_preview_help");
    viewer.querySelector(".live-embed-bar")?.after(help);
  }
  const toggleButtons = document.querySelectorAll("[data-toggle-embed]");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const container = document.getElementById("live-embed-viewer");
      if (!container) return;

      const isOpen = container.classList.toggle("is-open");
      container.hidden = !isOpen;
      btn.setAttribute("aria-expanded", String(isOpen));
      btn.querySelector("span").textContent = getTranslation(
        getCurrentLanguage(),
        isOpen ? "cs_hide_preview" : "cs_interactive_preview",
      );

      if (isOpen) {
        const iframe = container.querySelector(".live-embed-iframe");
        if (
          iframe &&
          iframe.getAttribute("src") === "about:blank" &&
          iframe.dataset.src
        ) {
          iframe.src = iframe.dataset.src;
        }
        container.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "auto"
            : "smooth",
          block: "nearest",
        });
      }
    });
  });

  const deviceButtons = document.querySelectorAll("[data-set-device]");
  deviceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const frameContainer = document.querySelector(
        ".live-embed-frame-container",
      );
      if (!frameContainer) return;

      deviceButtons.forEach((b) => {
        b.classList.remove("is-active");
        b.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", "true");

      const device = btn.dataset.setDevice;
      frameContainer.dataset.device = device;
    });
  });
}

/* ── Interactive Metric Counters ── */
function initMetricCounters() {
  const counterElements = document.querySelectorAll("[data-counter-target]");
  if (!counterElements.length) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const el = entry.target;
          obs.unobserve(el);
          const target = Number.parseInt(
            el.getAttribute("data-counter-target") || "0",
            10,
          );
          if (Number.isNaN(target)) continue;

          if (prefersReducedMotion) {
            el.textContent = formatCounterNumber(target, getCurrentLanguage());
            el.dataset.animated = "true";
            continue;
          }

          const duration = 1200;
          const startTime = performance.now();

          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = progress === 1 ? 1 : 1 - 2 ** (-10 * progress);
            const currentVal = Math.round(target * ease);
            el.textContent = formatCounterNumber(
              currentVal,
              getCurrentLanguage(),
            );

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              el.textContent = formatCounterNumber(
                target,
                getCurrentLanguage(),
              );
              el.dataset.animated = "true";
            }
          };

          requestAnimationFrame(animate);
        }
      }
    },
    { threshold: 0.2 },
  );

  for (const el of counterElements) {
    observer.observe(el);
  }
}

/* ── Card Spotlight & Subtle Tilt Effect ── */
function initCardSpotlight() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const cards = document.querySelectorAll(".project-card");
  for (const card of cards) {
    let frame = 0;
    let cardRect = null;

    const resetRect = () => {
      cardRect = null;
    };

    card.addEventListener(
      "pointerenter",
      () => {
        cardRect = card.getBoundingClientRect();
      },
      { passive: true },
    );

    window.addEventListener("scroll", resetRect, { passive: true });
    window.addEventListener("resize", resetRect, { passive: true });

    card.addEventListener(
      "pointermove",
      (e) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          if (!cardRect) cardRect = card.getBoundingClientRect();
          const x = Math.max(
            0,
            Math.min(e.clientX - cardRect.left, cardRect.width),
          );
          const y = Math.max(
            0,
            Math.min(e.clientY - cardRect.top, cardRect.height),
          );
          card.style.setProperty("--mouse-x", `${Math.round(x)}px`);
          card.style.setProperty("--mouse-y", `${Math.round(y)}px`);
        });
      },
      { passive: true },
    );

    card.addEventListener(
      "pointerleave",
      () => {
        cancelAnimationFrame(frame);
        cardRect = null;
        card.style.setProperty("--mouse-x", "-500px");
        card.style.setProperty("--mouse-y", "-500px");
      },
      { passive: true },
    );
  }
}

initImageLightbox();
initLiveEmbedViewer();
initMetricCounters();
initCardSpotlight();

// Failed artwork must not become an empty zoom control or hide project context.
document
  .querySelectorAll(".case-study-image, .project-thumbnail")
  .forEach((img) => {
    const unavailable = () => {
      if (img.classList.contains("image-unavailable")) return;
      img.classList.add("image-unavailable");
      img.removeAttribute("tabindex");
      img.removeAttribute("role");
      img.removeAttribute("aria-label");
      const note = document.createElement("span");
      note.className = "image-fallback";
      note.dataset.translate = "image_unavailable";
      note.textContent = getTranslation(
        getCurrentLanguage(),
        "image_unavailable",
      );
      img.after(note);
    };
    img.addEventListener("error", unavailable, { once: true });
    if (img.complete && !img.naturalWidth) unavailable();
  });

// ── Certificate Lightbox ──────────────────────────────────────────────────
function initCertLightbox() {
  const dialog = document.getElementById("cert-lightbox");
  if (!dialog) return;

  const wrap = dialog.querySelector(".cert-lightbox-img-wrap");
  const titleEl = dialog.querySelector(".cert-lightbox-title");
  const verifyLink = dialog.querySelector(".cert-lightbox-verify");
  const closeBtn = dialog.querySelector(".cert-lightbox-close");

  function openLightbox(btn) {
    const src = btn.dataset.certSrc;
    const title = btn.dataset.certTitle || "";
    const href = btn.dataset.certHref || "#";

    wrap.innerHTML = "";
    const img = document.createElement("img");
    img.className = "cert-lightbox-img";
    img.src = src;
    img.alt = `${title} certificate — Ahmed Saad Mahdy Sayed`;
    img.decoding = "async";
    wrap.appendChild(img);

    titleEl.textContent = title;
    verifyLink.href = href;
    dialog.showModal();
    closeBtn.focus();
  }

  function closeLightbox() {
    dialog.close();
  }

  document.querySelectorAll(".cert-thumb-btn").forEach((btn) => {
    btn.addEventListener("click", () => openLightbox(btn));
  });

  closeBtn.addEventListener("click", closeLightbox);

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) closeLightbox();
  });

  dialog.addEventListener("close", () => {
    wrap.replaceChildren();
  });
}

// ── Case Study Section Deep Link Copy ─────────────────────────────────────
function bindSectionCopyButtons() {
  document.querySelectorAll("[data-copy-section]").forEach((button) => {
    if (button.dataset.sectionCopyBound === "true") return;
    button.dataset.sectionCopyBound = "true";

    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const sectionId = button.dataset.copySection;
      const url = new URL(window.location.href);
      url.hash = sectionId;
      const lang = getCurrentLanguage();

      try {
        await copyText(url.toString());
        showToast(
          getTranslation(
            lang,
            "cs_section_copied",
            "Section link copied to clipboard!",
          ),
        );
        setUseIcon(button, "#icon-check");
        button.classList.add("copied");

        window.setTimeout(() => {
          setUseIcon(button, "#icon-copy");
          button.classList.remove("copied");
        }, 1500);
      } catch {
        showToast(`${getTranslation(lang, "toast_failed")} ${url.toString()}`);
      }
    });
  });
}
