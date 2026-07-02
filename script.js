const root = document.documentElement;
const storageKeys = {
  theme: "resume-theme",
  lang: "resume-lang",
  contrast: "resume-contrast",
};

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const savedTheme = localStorage.getItem(storageKeys.theme);
const savedLang = localStorage.getItem(storageKeys.lang) || "en";
const savedContrast = localStorage.getItem(storageKeys.contrast) || "normal";

const controls = {
  themeToggle: document.querySelector(".theme-toggle"),
  langToggle: document.querySelector(".lang-toggle"),
  contrastToggle: document.querySelector(".contrast-toggle"),
  printButton: document.querySelector(".print-button"),
};

const metaNodes = {
  description: document.getElementById("meta-description"),
  themeColor: document.querySelector('meta[name="theme-color"]'),
  ogTitle: document.getElementById("og-title"),
  ogDescription: document.getElementById("og-description"),
  twitterTitle: document.getElementById("twitter-title"),
  twitterDescription: document.getElementById("twitter-description"),
  personSchema: document.getElementById("person-schema"),
};

const themeIconUse = controls.themeToggle?.querySelector("use");
const copyToast = document.createElement("div");
let toastTimer;

copyToast.className = "copy-toast";
copyToast.setAttribute("role", "status");
copyToast.setAttribute("aria-live", "polite");
document.body.appendChild(copyToast);

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
  ],
};

const translations = {
  ar: {
    about_text:
      "مصمم تجربة مستخدم ومصور بيانات بخبرة تزيد عن 8 سنوات في تحويل احتياجات المستخدمين والأعمال إلى لوحات معلومات تفاعلية وتجارب رقمية متمحورة حول المستخدم. ماهر في أبحاث المستخدم، وبنية المعلومات، وسرد البيانات، وتصميم الواجهات سهلة الوصول باستخدام Excel وPower BI وTableau وSQL وPython.",
    aria_print_resume: "طباعة السيرة الذاتية أو حفظها كملف PDF",
    aria_switch_to_arabic: "التبديل إلى العربية",
    aria_switch_to_dark: "التبديل إلى الوضع الداكن",
    aria_switch_to_english: "التبديل إلى الإنجليزية",
    aria_switch_to_high_contrast: "التبديل إلى التباين العالي",
    aria_switch_to_light: "التبديل إلى الوضع الفاتح",
    aria_switch_to_normal_contrast: "التبديل إلى التباين العادي",
    cert1: "تحليل البيانات من جوجل (Google Data Analytics)",
    cert2: "تحليل ذكاء الأعمال Tableau (Tableau Business Intelligence Analyst)",
    cert3: "مهارات Excel لتحليل البيانات والتصوير المرئي",
    cert4: "مهارات Excel للأعمال",
    cert5: "تصميم تجربة المستخدم من جوجل (Google UX Design)",
    contact_links_label: "روابط التواصل",
    data_tag: "تصوير البيانات",
    display_settings_label: "إعدادات العرض",
    edu1_date: "سبتمبر 2016 - يونيو 2017",
    edu1_school: "معهد تكنولوجيا المعلومات (ITI)",
    edu1_title: "دبلوم في تقنيات التعليم وتكنولوجيا المعلومات",
    edu2_date: "سبتمبر 2009 - يونيو 2013",
    edu2_school: "جامعة المنوفية",
    edu2_title: "بكالوريوس في الإذاعة والتلفزيون",
    exp_tag: "خبرة +8 سنوات",
    external_site_hint: "يفتح في موقع خارجي",
    highlights_label: "أبرز النقاط",
    job1_b1: "قيادة تصميم تجربة وواجهة المستخدم (UX/UI) لمنصات (SaaS) المؤسسية و(B2B) المعقدة، وتقديم حلول تتمحور حول المستخدم.",
    job1_b2: "تأسيس أنظمة تصميم قابلة للتوسع باستخدام Figma وAdobe Creative Suite والمنهجيات الحديثة.",
    job1_b3: "الاستفادة من أدوات التصميم المدعومة بالذكاء الاصطناعي لتسريع النماذج الأولية وتلخيص أبحاث تجربة المستخدم.",
    job1_company: "أدفانسيز للحلول البرمجية",
    job1_date: "يناير 2023 - الحالي · 3 سنوات و6 أشهر",
    job1_title: "مصمم تجربة المستخدم",
    job2_b1: "إعادة تصميم منصات وواجهات التعلم المؤسسية، مما زاد من تفاعل المستخدمين ومعدلات إكمال التدريب بنسبة 30%.",
    job2_b2: "تحويل المتطلبات التقنية المعقدة إلى تجارب تعلم إلكترونية B2B سهلة الوصول وبديهية.",
    job2_company: "شنايدر إلكتريك",
    job2_date: "يوليو 2018 - يناير 2023 · 4 سنوات و7 أشهر",
    job2_location: "محافظة القاهرة، مصر",
    job2_title: "مصمم تعليمي",
    main_resume_label: "محتوى السيرة الذاتية الرئيسي",
    meta_description:
      "السيرة الذاتية لأحمد مهدي، مصمم تجربة مستخدم ومصور بيانات، مع خبرة في التصميم، ولوحات المعلومات، وتجارب المنتجات الرقمية.",
    meta_title: "أحمد مهدي | مصمم تجربة المستخدم ومصور بيانات",
    name: "أحمد مهدي",
    profile_details_label: "تفاصيل الملف الشخصي",
    proj_data1_desc:
      "تجربة تفاعلية لتصور البيانات باستخدام Tableau تساعد المستخدمين على استكشاف مجموعات LEGO حسب الموضوع، والعمر، والسعر، وعدد القطع.",
    proj_data1_title: "مستكشف ليجو المعتمد على البيانات",
    proj_data2_desc:
      "لوحة معلومات لمبيعات علاقات العملاء (CRM) تم بناؤها في Google Sheets لتتبع أداء الفريق الربع سنوي عبر التصور المعتمد على الرسوم البيانية.",
    proj_data2_title: "لوحة معلومات أداء المبيعات",
    proj_data_header: "مشاريع تحليل وتصوير البيانات",
    proj_ux1_desc:
      "تطبيق الموارد البشرية (SaaS) مستجيب يركز على الخصوصية ويحسن طلبات الإجازات وإدارة الأدوار من خلال واجهات حديثة وسهلة الاستخدام.",
    proj_ux1_title: "أداة الموارد البشرية",
    proj_ux2_desc:
      "لوحة تحكم تشغيلية عالية الدقة تركز على تصور البيانات في الوقت الفعلي والتسلسل الهرمي الواضح للمعلومات والأداء المتجاوب.",
    proj_ux2_title: "مركز التحكم بمطار القاهرة الدولي",
    proj_ux3_desc:
      "تجربة تجارة إلكترونية بديهية وسهلة الوصول، مصممة بتخطيطات متجاوبة وتنقل سلس لزيادة تفاعل المستخدمين والتحويلات.",
    proj_ux3_title: "تطبيق حاج عرفة",
    proj_ux_header: "مشاريع تجربة المستخدم",
    resume_label: "موقع السيرة الذاتية لأحمد مهدي",
    sect_about: "نبذة عني",
    sect_certs: "الشهادات المهنية",
    sect_edu: "التعليم",
    sect_jobs: "الخبرات المهنية",
    sect_projects: "المشاريع",
    sect_skills: "المهارات",
    skill_data1: "مايكروسوفت إكسل (متقدم)",
    skill_data2: "باور بي آي (Power BI)",
    skill_data3: "تابلو (Tableau)",
    skill_data4: "بايثون (Python)",
    skill_data5: "لغة الاستعلامات (SQL)",
    skill_data6: "تصميم لوحات المعلومات",
    skill_data7: "سرد البيانات قصصياً",
    skill_data8: "تحليل مؤشرات الأداء (KPI)",
    skill_ux1: "تصميم التفاعل",
    skill_ux10: "تصميم المؤسسات ومنتجات SaaS",
    skill_ux11: "حزمة Adobe الإبداعية",
    skill_ux12: "أدوات التصميم بالذكاء الاصطناعي",
    skill_ux2: "بنية المعلومات",
    skill_ux3: "أبحاث المستخدمين",
    skill_ux4: "اختبار سهولة الاستخدام",
    skill_ux5: "التخطيط الهيكلي (Wireframing)",
    skill_ux6: "بناء النماذج الأولية",
    skill_ux7: "فيجما (Figma)",
    skill_ux8: "أنظمة التصميم",
    skill_ux9: "سهولة الوصول (a11y)",
    skills_data_header: "تحليل وتصوير البيانات",
    skills_ux_header: "تصميم تجربة المستخدم",
    skip_link: "تجاوز إلى المحتوى الرئيسي",
    title: "مصمم تجربة المستخدم ومصور بيانات",
    toast_copied: "تم النسخ",
    toast_failed: "فشل النسخ",
    tooltip_contrast: "تبديل التباين العالي",
    tooltip_copy_cert: "نسخ رابط الشهادة",
    tooltip_copy_dribbble: "نسخ رابط دريبل",
    tooltip_copy_email: "نسخ البريد الإلكتروني",
    tooltip_copy_linkedin: "نسخ رابط لينكد إن",
    tooltip_copy_project: "نسخ رابط المشروع",
    tooltip_lang: "تبديل اللغة",
    tooltip_print: "طباعة / حفظ كـ PDF",
    tooltip_theme_dark: "التبديل إلى الوضع الداكن",
    tooltip_theme_light: "التبديل إلى الوضع الفاتح",
    ux_tag: "تصميم تجربة المستخدم",
  },
  en: {
    about_text:
      "UX Designer & Data Visualizer with 8+ years of experience turning user and business needs into decision-ready dashboards and user-centered digital experiences. Skilled in user research, information architecture, data storytelling, visualization, and accessible interface design with Excel, Power BI, Tableau, SQL, and Python.",
    aria_print_resume: "Print the resume or save it as PDF",
    aria_switch_to_arabic: "Switch to Arabic",
    aria_switch_to_dark: "Switch to dark mode",
    aria_switch_to_english: "Switch to English",
    aria_switch_to_high_contrast: "Switch to high contrast",
    aria_switch_to_light: "Switch to light mode",
    aria_switch_to_normal_contrast: "Switch to normal contrast",
    cert1: "Google Data Analytics",
    cert2: "Tableau Business Intelligence Analyst",
    cert3: "Excel Skills for Data Analytics and Visualization",
    cert4: "Excel Skills for Business",
    cert5: "Google UX Design",
    contact_links_label: "Contact links",
    data_tag: "Data Visualization",
    display_settings_label: "Display settings",
    edu1_date: "Sep 2016 - Jun 2017",
    edu1_school: "Information Technology Institute (ITI)",
    edu1_title: "Diploma of Education/Instructional Technology",
    edu2_date: "Sep 2009 - Jun 2013",
    edu2_school: "Minufiya University",
    edu2_title: "Bachelor's degree, Radio and Television",
    exp_tag: "8+ years experience",
    external_site_hint: "opens external site",
    highlights_label: "Highlights",
    job1_b1: "Led UX/UI design for complex B2B and enterprise SaaS platforms, driving user-centric solutions.",
    job1_b2: "Established scalable design systems utilizing Figma, Adobe Creative Suite, and modern methodologies.",
    job1_b3: "Leveraged AI-powered design tools to accelerate rapid prototyping and UX research synthesis.",
    job1_company: "Advansys IS",
    job1_date: "Jan 2023 - Present · 3 yrs 6 mos",
    job1_title: "User Experience Designer",
    job2_b1: "Redesigned enterprise learning platforms and interfaces, increasing user engagement and training completion rates by 30%.",
    job2_b2: "Translated complex technical requirements into accessible, intuitive B2B e-learning experiences.",
    job2_company: "Schneider Electric",
    job2_date: "Jul 2018 - Jan 2023 · 4 yrs 7 mos",
    job2_location: "Cairo Governorate, Egypt",
    job2_title: "Instructional Designer",
    main_resume_label: "Main resume content",
    meta_description:
      "Ahmed Mahdy portfolio resume featuring UX design, data visualization, dashboards, and accessible digital product work.",
    meta_title: "Ahmed Mahdy | UX Designer & Data Visualizer",
    name: "Ahmed Mahdy",
    profile_details_label: "Profile details",
    proj_data1_desc:
      "An interactive Tableau visualization experience that helps users explore LEGO sets by theme, age, price, and set count.",
    proj_data1_title: "A Data-Driven LEGO Explorer",
    proj_data2_desc:
      "CRM sales dashboard built in Google Sheets for tracking quarterly team performance through chart-based visualization.",
    proj_data2_title: "Sales Performance Dashboard",
    proj_data_header: "Data Analysis & Visualization Projects",
    proj_ux1_desc:
      "A responsive, privacy-centric HR SaaS application optimizing leave requests and role management through modern, user-friendly interfaces.",
    proj_ux1_title: "Human Resources Tool",
    proj_ux2_desc:
      "A high-fidelity operational command dashboard focusing on real-time data visualization, clear information hierarchy, and responsive performance.",
    proj_ux2_title: "Cairo International Airport - Command Hub",
    proj_ux3_desc:
      "An intuitive, accessible e-commerce experience designed with responsive layouts and seamless navigation to maximize user conversion and engagement.",
    proj_ux3_title: "Haj Arafa App",
    proj_ux_header: "UX Projects",
    resume_label: "Ahmed Mahdy resume portfolio",
    sect_about: "About Me",
    sect_certs: "Certifications",
    sect_edu: "Education",
    sect_jobs: "Employment",
    sect_projects: "Projects",
    sect_skills: "Skills",
    skill_data1: "Microsoft Excel (Advanced)",
    skill_data2: "Power BI",
    skill_data3: "Tableau",
    skill_data4: "Python",
    skill_data5: "SQL",
    skill_data6: "Dashboard Design",
    skill_data7: "Data Storytelling",
    skill_data8: "KPI Analysis",
    skill_ux1: "Interaction Design",
    skill_ux10: "Enterprise & SaaS Design",
    skill_ux11: "Adobe Creative Suite",
    skill_ux12: "AI Design Tools",
    skill_ux2: "Information Architecture",
    skill_ux3: "User Research",
    skill_ux4: "Usability Testing",
    skill_ux5: "Wireframing",
    skill_ux6: "Prototyping",
    skill_ux7: "Figma",
    skill_ux8: "Design Systems",
    skill_ux9: "Accessibility",
    skills_data_header: "Data Analysis & Visualization",
    skills_ux_header: "Core UX & Design",
    skip_link: "Skip to main content",
    title: "UX Designer & Data Visualizer",
    toast_copied: "Copied",
    toast_failed: "Copy failed",
    tooltip_contrast: "Toggle high contrast",
    tooltip_copy_cert: "Copy certification link",
    tooltip_copy_dribbble: "Copy Dribbble link",
    tooltip_copy_email: "Copy email",
    tooltip_copy_linkedin: "Copy LinkedIn link",
    tooltip_copy_project: "Copy project link",
    tooltip_lang: "Toggle language",
    tooltip_print: "Print / Save as PDF",
    tooltip_theme_dark: "Switch to dark mode",
    tooltip_theme_light: "Switch to light mode",
    ux_tag: "UX Design",
  },
};

function getCurrentLanguage() {
  return root.getAttribute("lang") || "en";
}

function getTranslation(lang, key, fallback = "") {
  return translations[lang]?.[key] ?? fallback;
}

function setUseIcon(button, iconId) {
  const useNode = button?.querySelector("use");
  if (useNode) {
    useNode.setAttribute("href", iconId);
  }
}

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

function updateMetadata(lang) {
  const title = getTranslation(lang, "meta_title", document.title);
  const description = getTranslation(
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
    metaNodes.personSchema.textContent = JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Ahmed Mahdy",
        jobTitle: getTranslation(lang, "title", "UX Designer & Data Visualizer"),
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

function updateTranslatedText(lang) {
  document.querySelectorAll("[data-translate]").forEach((node) => {
    const key = node.dataset.translate;
    const value = getTranslation(lang, key);

    if (value) {
      node.textContent = value;
    }
  });
}

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

function updateExternalLinks(lang) {
  const hint = getTranslation(lang, "external_site_hint");

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const label = link.textContent.trim();
    link.setAttribute("aria-label", `${label} (${hint})`);
    link.setAttribute("title", hint);
  });
}

function updateCopyButtons(lang) {
  document.querySelectorAll("[data-copy]").forEach((button) => {
    const key = button.dataset.tooltipKey;
    const label = getTranslation(lang, key, button.getAttribute("aria-label") || "");

    if (label) {
      button.setAttribute("aria-label", label);
      button.setAttribute("data-tooltip", label);
    }
  });
}

function updateLanguageButton(lang) {
  const nextLanguageLabel =
    lang === "ar"
      ? getTranslation(lang, "aria_switch_to_english")
      : getTranslation(lang, "aria_switch_to_arabic");

  controls.langToggle?.setAttribute("aria-label", nextLanguageLabel);
  controls.langToggle?.setAttribute("data-tooltip", getTranslation(lang, "tooltip_lang"));
}

function updateThemeButton(lang) {
  const isDark = root.dataset.theme === "dark";
  const ariaLabel = isDark
    ? getTranslation(lang, "aria_switch_to_light")
    : getTranslation(lang, "aria_switch_to_dark");
  const tooltip = isDark
    ? getTranslation(lang, "tooltip_theme_light")
    : getTranslation(lang, "tooltip_theme_dark");

  controls.themeToggle?.setAttribute("aria-label", ariaLabel);
  controls.themeToggle?.setAttribute("aria-pressed", String(isDark));
  controls.themeToggle?.setAttribute("data-tooltip", tooltip);
  setUseIcon(controls.themeToggle, isDark ? "#icon-sun" : "#icon-moon");
}

function updateContrastButton(lang) {
  const isHigh = root.dataset.contrast === "high";
  const ariaLabel = isHigh
    ? getTranslation(lang, "aria_switch_to_normal_contrast")
    : getTranslation(lang, "aria_switch_to_high_contrast");

  controls.contrastToggle?.setAttribute("aria-label", ariaLabel);
  controls.contrastToggle?.setAttribute("aria-pressed", String(isHigh));
  controls.contrastToggle?.setAttribute("data-tooltip", getTranslation(lang, "tooltip_contrast"));
  controls.contrastToggle?.classList.toggle("active", isHigh);
}

function updatePrintButton(lang) {
  controls.printButton?.setAttribute("aria-label", getTranslation(lang, "aria_print_resume"));
  controls.printButton?.setAttribute("data-tooltip", getTranslation(lang, "tooltip_print"));
}

function refreshUi(lang) {
  updateTranslatedText(lang);
  updateTranslatedAttributes(lang);
  updateMetadata(lang);
  updateExternalLinks(lang);
  updateCopyButtons(lang);
  updateLanguageButton(lang);
  updateThemeButton(lang);
  updateContrastButton(lang);
  updatePrintButton(lang);
}

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem(storageKeys.theme, theme);
  updateThemeColor();
  updateThemeButton(getCurrentLanguage());
}

function setContrast(contrast) {
  root.dataset.contrast = contrast;
  localStorage.setItem(storageKeys.contrast, contrast);
  updateThemeColor();
  updateContrastButton(getCurrentLanguage());
}

function setLanguage(lang) {
  root.setAttribute("lang", lang);
  root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  localStorage.setItem(storageKeys.lang, lang);
  refreshUi(lang);
}

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  const selection = window.getSelection();
  const activeElement = document.activeElement;
  const originalRange = selection && selection.rangeCount > 0
    ? selection.getRangeAt(0)
    : null;

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

function showToast(message) {
  window.clearTimeout(toastTimer);
  copyToast.textContent = message;
  copyToast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    copyToast.classList.remove("is-visible");
  }, 1800);
}

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

function enhanceLinkedCards() {
  document.querySelectorAll(".compact-list a, .featured h4 a").forEach((link) => {
    const container = link.closest("li, article");

    if (!container || container.querySelector(".copy-button")) {
      return;
    }

    const isCertification = link.closest(".compact-list") !== null;
    const tooltipKey = isCertification ? "tooltip_copy_cert" : "tooltip_copy_project";
    const label = getTranslation("en", tooltipKey);
    const copyButton = createCopyButton(link.href, label, tooltipKey);

    container.appendChild(copyButton);
    container.addEventListener("click", (event) => {
      if (event.target.closest("a, button")) {
        return;
      }

      link.click();
    });
  });
}

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
        showToast(getTranslation(lang, "toast_copied"));

        setUseIcon(button, "#icon-check");
        button.classList.add("copied");

        window.setTimeout(() => {
          setUseIcon(button, "#icon-copy");
          button.classList.remove("copied");
        }, 1500);
      } catch {
        showToast(getTranslation(lang, "toast_failed"));
      }
    });
  });
}

function updatePrintStyles() {
  const lang = getCurrentLanguage();
  const isRtl = root.getAttribute("dir") === "rtl";
  const nameText =
    document.querySelector('h1[data-translate="name"]')?.textContent?.trim() || "Ahmed Mahdy";
  const titleText =
    document.querySelector('p[data-translate="title"]')?.textContent?.trim() ||
    "UX Designer & Data Visualizer";
  const dateText = new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const pageText = lang === "ar" ? "صفحة" : "Page";
  const ofText = lang === "ar" ? "من" : "of";
  const leftContent = isRtl ? `"${nameText} | ${titleText}"` : `"${dateText}"`;
  const rightContent = isRtl ? `"${dateText}"` : `"${nameText} | ${titleText}"`;

  let dynamicStyle = document.getElementById("print-dynamic-style");

  if (!dynamicStyle) {
    dynamicStyle = document.createElement("style");
    dynamicStyle.id = "print-dynamic-style";
    document.head.appendChild(dynamicStyle);
  }

  dynamicStyle.textContent = `
    @media print {
      @page {
        @top-left {
          content: ${leftContent} !important;
        }
        @top-right {
          content: ${rightContent} !important;
        }
        @bottom-center {
          content: "${pageText} " counter(page) " ${ofText} " counter(pages) !important;
        }
      }
    }
  `;
}

function initialize() {
  const contactList = document.querySelector(".contact-list");

  if (contactList) {
    contactList.setAttribute("lang", "en");
  }

  enhanceLinkedCards();
  bindCopyButtons();

  setTheme(savedTheme || (prefersDark ? "dark" : "light"));
  setContrast(savedContrast);
  setLanguage(savedLang);
}

controls.themeToggle?.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

controls.contrastToggle?.addEventListener("click", () => {
  setContrast(root.dataset.contrast === "high" ? "normal" : "high");
});

controls.langToggle?.addEventListener("click", () => {
  setLanguage(getCurrentLanguage() === "ar" ? "en" : "ar");
});

controls.printButton?.addEventListener("click", () => {
  window.print();
});

window.addEventListener("beforeprint", updatePrintStyles);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    const focused = document.activeElement;

    if (focused instanceof HTMLElement && focused.hasAttribute("data-tooltip")) {
      focused.blur();
    }
  }
});

initialize();
