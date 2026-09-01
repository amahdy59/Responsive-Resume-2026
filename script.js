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

const copyToast = document.querySelector(".copy-toast") || document.createElement("div");
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
  ],
};

const translations = {
  ar: {
    about_text:
      "مصمم تجربة مستخدم ومصور بيانات بخبرة تزيد عن 8 سنوات في تحويل احتياجات المستخدمين والأعمال إلى لوحات معلومات تفاعلية وتجارب رقمية متمحورة حول المستخدم. ماهر في أبحاث المستخدم، وبنية المعلومات، وسرد البيانات، وتصميم الواجهات سهلة الوصول باستخدام Excel وPower BI وTableau وSQL وPython.",
    aria_dark_mode: "الوضع الداكن",
    aria_high_contrast_mode: "وضع التباين العالي",
    aria_switch_to_arabic: "التبديل إلى العربية",
    aria_switch_to_english: "التبديل إلى الإنجليزية",
    cert1: "تحليل البيانات من جوجل (Google Data Analytics)",
    cert2: "تحليل ذكاء الأعمال Tableau (Tableau Business Intelligence Analyst)",
    cert3: "مهارات Excel لتحليل البيانات والتصوير المرئي",
    cert4: "مهارات Excel للأعمال",
    cert5: "تصميم تجربة المستخدم من جوجل (Google UX Design)",
    back_to_top: "العودة إلى الأعلى",
    control_contrast: "التباين",
    control_language: "اللغة",
    control_theme: "المظهر",
    contact_dribbble: "معرض دريبل",
    contact_linkedin: "لينكد إن",
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
    footer_cta: "لنعمل معاً",
    footer_email: "راسل أحمد",
    footer_text: "هل تبحث عن خبرة في تجربة المستخدم، أو المنتجات سهلة الوصول، أو تجارب البيانات الداعمة للقرار؟",
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
    opens_new_tab: " يفتح في تبويب جديد",
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
    proj_ux4_desc:
      "تطبيق ويب هادئ وسهل الوصول للأذكار اليومية ومواقيت الصلاة، مصمم لتعزيز الاستمرارية والتركيز الروحي.",
    proj_ux4_title: "تطبيق الأذكار - الحصن اليومي",
    proj_ux_header: "مشاريع تجربة المستخدم",
    print_resume_action: "طباعة / حفظ PDF",
    read_case_study: "قراءة دراسة الحالة بالإنجليزية",
    resume_card_label: "نظرة عامة على السيرة الذاتية",
    resume_label: "موقع السيرة الذاتية لأحمد مهدي",
    section_nav_label: "أقسام السيرة الذاتية",
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
    skip_link: "تجاوز إلى محتوى السيرة الذاتية",
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
    tooltip_theme_dark: "التبديل إلى الوضع الداكن",
    tooltip_theme_light: "التبديل إلى الوضع الفاتح",
    tooltip_visit_live_site: "زيارة الموقع المباشر",
    ux_tag: "تصميم تجربة المستخدم",
    visit_live_project: "زيارة موقع المشروع المباشر",
    filter_all: "الكل",
    filter_ux: "تصميم UX",
    filter_data: "تصوير البيانات",
    filter_projects_label: "تصفية المشاريع حسب الفئة",
    filter_showing: "عرض",
    filter_projects: "مشاريع",
    collapse_project: "طي",
    expand_project: "توسيع",
  },
  en: {
    about_text:
      "UX Designer & Data Visualizer with 8+ years of experience turning user and business needs into decision-ready dashboards and user-centered digital experiences. Skilled in user research, information architecture, data storytelling, visualization, and accessible interface design with Excel, Power BI, Tableau, SQL, and Python.",
    aria_dark_mode: "Dark mode",
    aria_high_contrast_mode: "High contrast mode",
    aria_switch_to_arabic: "Switch to Arabic",
    aria_switch_to_english: "Switch to English",
    cert1: "Google Data Analytics",
    cert2: "Tableau Business Intelligence Analyst",
    cert3: "Excel Skills for Data Analytics and Visualization",
    cert4: "Excel Skills for Business",
    cert5: "Google UX Design",
    back_to_top: "Back to top",
    control_contrast: "Contrast",
    control_language: "Language",
    control_theme: "Theme",
    contact_dribbble: "Dribbble portfolio",
    contact_linkedin: "LinkedIn profile",
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
    footer_cta: "Let’s work together",
    footer_email: "Email Ahmed",
    footer_text: "Interested in UX, accessible products, or decision-ready data experiences?",
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
    opens_new_tab: " opens in new tab",
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
    proj_ux4_desc:
      "A serene, accessible Islamic daily remembrance and prayer times web application designed for spiritual consistency and focus.",
    proj_ux4_title: "Azkar App – Daily Fortress",
    proj_ux_header: "UX Projects",
    print_resume_action: "Print / Save PDF",
    read_case_study: "Read Case Study",
    resume_card_label: "Resume overview",
    resume_label: "Ahmed Mahdy resume portfolio",
    section_nav_label: "Resume sections",
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
    skip_link: "Skip to resume content",
    title: "UX Designer & Data Visualizer",
    toast_copied: "Copied",
    toast_copy_cert: "Certification link copied to clipboard",
    toast_copy_dribbble: "Dribbble link copied to clipboard",
    toast_copy_email: "Email address copied to clipboard",
    toast_copy_linkedin: "LinkedIn link copied to clipboard",
    toast_copy_project: "Project link copied to clipboard",
    toast_failed: "Copy failed",
    tooltip_contrast: "Toggle high contrast",
    tooltip_copy_cert: "Copy certification link",
    tooltip_copy_dribbble: "Copy Dribbble link",
    tooltip_copy_email: "Copy email",
    tooltip_copy_linkedin: "Copy LinkedIn link",
    tooltip_copy_project: "Copy project link",
    tooltip_lang: "Toggle language",
    tooltip_theme_dark: "Switch to dark mode",
    tooltip_theme_light: "Switch to light mode",
    tooltip_visit_live_site: "Visit Live Site",
    ux_tag: "UX Design",
    visit_live_project: "Visit live project",
    filter_all: "All",
    filter_ux: "UX Design",
    filter_data: "Data Visualization",
    filter_projects_label: "Filter projects by category",
    filter_showing: "Showing",
    filter_projects: "projects",
    collapse_project: "Collapse",
    expand_project: "Expand",
  },
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

/**
 * Replaces text content for all elements with [data-translate] attributes.
 * @param {'en'|'ar'} lang - Language code.
 */
function updateTranslatedText(lang) {
  document.querySelectorAll("[data-translate]").forEach((node) => {
    const key = node.dataset.translate;
    const value = getTranslation(lang, key);

    if (value) {
      node.textContent = value;
    }
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
    lang === "ar" ? " \u064a\u0641\u062a\u062d \u0641\u064a \u062a\u0628\u0648\u064a\u0628 \u062c\u062f\u064a\u062f" : " opens in new tab",
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

    if (!link.querySelector(".external-icon")) {
      const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
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
    lang === "ar" ? "\u064a\u0641\u062a\u062d \u0641\u064a \u062a\u0628\u0648\u064a\u0628 \u062c\u062f\u064a\u062f" : "opens in new tab",
  ).trim();

  ensureExternalLinkNotes(lang);

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    let label = getLinkText(link);
    if (!label) {
      const article = link.closest("article");
      const projectTitle = article?.querySelector("h4")?.textContent?.trim();
      const fallbackKey = link.dataset.tooltipKey;
      const baseLabel = fallbackKey ? getTranslation(lang, fallbackKey, "Visit live site") : "Visit live site";
      label = projectTitle ? `${baseLabel}: ${projectTitle}` : baseLabel;
    }
    const context = [hint, newTabText].filter(Boolean).join(", ");

    link.setAttribute("aria-label", context ? `${label} (${context})` : label);
    link.setAttribute("title", context || label);

    if (link.dataset.tooltipKey) {
      link.setAttribute("data-tooltip", getTranslation(lang, link.dataset.tooltipKey, link.getAttribute("data-tooltip") || ""));
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
    const genericLabel = getTranslation(lang, key, button.getAttribute("aria-label") || "");
    const link = button.closest("li, article")?.querySelector("a");
    const includesSubject = key === "tooltip_copy_cert" || key === "tooltip_copy_project";
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

  controls.langToggle?.setAttribute("aria-label", nextLanguageLabel);
  controls.langToggle?.setAttribute("data-tooltip", getTranslation(lang, "tooltip_lang"));
}

/**
 * Updates the theme toggle button icon, aria-label, aria-pressed, and tooltip
 * to reflect the current theme state.
 * @param {'en'|'ar'} lang - Language code for translated labels.
 */
function updateThemeButton(lang) {
  const isDark = root.dataset.theme === "dark";
  const tooltip = isDark
    ? getTranslation(lang, "tooltip_theme_light")
    : getTranslation(lang, "tooltip_theme_dark");

  controls.themeToggle?.setAttribute("aria-label", getTranslation(lang, "aria_dark_mode"));
  controls.themeToggle?.setAttribute("aria-pressed", String(isDark));
  controls.themeToggle?.setAttribute("data-tooltip", tooltip);
  setUseIcon(controls.themeToggle, isDark ? "#icon-sun" : "#icon-moon");
}

/**
 * Updates the contrast toggle button aria-label, aria-pressed, tooltip,
 * and active class to reflect the current contrast state.
 * @param {'en'|'ar'} lang - Language code for translated labels.
 */
function updateContrastButton(lang) {
  const isHigh = root.dataset.contrast === "high";

  controls.contrastToggle?.setAttribute(
    "aria-label",
    getTranslation(lang, "aria_high_contrast_mode"),
  );
  controls.contrastToggle?.setAttribute("aria-pressed", String(isHigh));
  controls.contrastToggle?.setAttribute("data-tooltip", getTranslation(lang, "tooltip_contrast"));
  controls.contrastToggle?.classList.toggle("active", isHigh);
}

/**
 * Orchestrates a full UI refresh for a language switch or initial load.
 * Runs all translation, metadata, link, button, and aria-label update functions.
 * @param {'en'|'ar'} lang - Language code to apply.
 */
function refreshUi(lang) {
  if (document.body.dataset.localized !== "false") {
    updateTranslatedText(lang);
    updateTranslatedAttributes(lang);
    updateMetadata(lang);
  }
  updateExternalLinks(lang);
  updateCopyButtons(lang);
  updateLanguageButton(lang);
  updateThemeButton(lang);
  updateContrastButton(lang);
}

/**
 * Applies a theme, persists it to localStorage, and refreshes the UI.
 * @param {'light'|'dark'} theme - Theme name to apply.
 */
function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem(storageKeys.theme, theme);
  updateThemeColor();
  updateThemeButton(getCurrentLanguage());
}

/**
 * Applies a contrast mode, persists it to localStorage, and refreshes the UI.
 * @param {'normal'|'high'} contrast - Contrast level to apply.
 */
function setContrast(contrast) {
  root.dataset.contrast = contrast;
  localStorage.setItem(storageKeys.contrast, contrast);
  updateThemeColor();
  updateContrastButton(getCurrentLanguage());
}

/**
 * Switches the active language: updates the html element's lang/dir attributes,
 * persists the choice to localStorage, and runs a full UI refresh.
 * @param {'en'|'ar'} lang - Language code to activate.
 */
function setLanguage(lang, persist = true) {
  root.setAttribute("lang", lang);
  root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  if (persist) localStorage.setItem(storageKeys.lang, lang);
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
 * Dynamically injects copy buttons into certification and project cards,
 * and makes the entire card clickable (excluding the link and button themselves).
 * Safe to call multiple times — skips cards that already have a copy button.
 */
function enhanceLinkedCards() {
  document.querySelectorAll(".compact-list a, .featured h4 a").forEach((link) => {
    const container = link.closest("li, article");

    if (!container || container.querySelector(".copy-button")) {
      return;
    }

    const isCertification = link.closest(".compact-list") !== null;
    const tooltipKey = isCertification ? "tooltip_copy_cert" : "tooltip_copy_project";
    const label = getTranslation(getCurrentLanguage(), tooltipKey);
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
        showToast(getTranslation(lang, "toast_failed"));
      }
    });
  });
}

/**
 * Dynamically generates and injects a <style> block that populates @page
 * running headers and footers with the current name, title, date, and
 * page counter — localised for the active language and text direction.
 */
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

/**
 * Entry point. Enhances cards with copy buttons, binds all copy button
 * listeners, then applies the saved (or system-preferred) theme, contrast,
 * and language to boot the UI.
 */
/**
 * Project Filter Pills
 * ─────────────────────────────────────────────────────────────────────
 * Supports:
 *  - 3 filter buttons (All / UX Design / Data Visualization)
 *  - aria-pressed state management (exactly one active at a time)
 *  - Arrow-key navigation within the filter bar (roving focus)
 *  - Animated show/hide (respects prefers-reduced-motion)
 *  - ARIA live region announces count of visible projects
 *  - Hides the category group h3 when that group's filter is active
 *  - Fully bilingual (EN/AR) via the existing translation system
 */
function initProjectFilters() {
  const filterBar = document.querySelector(".project-filter-bar");
  if (!filterBar) return;

  const pills = Array.from(filterBar.querySelectorAll(".project-filter-pill"));
  const articles = Array.from(document.querySelectorAll(".projects-panel article[data-category]"));
  const groups = Array.from(document.querySelectorAll(".projects-panel .project-group[data-group-category]"));
  const announcement = document.getElementById("filter-results-announcement");
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function applyFilter(filterValue) {
    pills.forEach((pill) => {
      const isActive = pill.dataset.filter === filterValue;
      pill.classList.toggle("is-active", isActive);
      pill.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    let visibleCount = 0;

    articles.forEach((article) => {
      const matches = filterValue === "all" || article.dataset.category === filterValue;
      if (matches) {
        visibleCount++;
        article.removeAttribute("hidden");
        if (!prefersReduced) {
          article.style.animationName = "none";
          // Force reflow to restart animation
          void article.offsetHeight;
          article.style.animationName = "";
        }
      } else {
        article.setAttribute("hidden", "");
      }
    });

    // Show/hide group headers: hide h3 when a specific filter is active
    groups.forEach((group) => {
      if (filterValue === "all") {
        group.removeAttribute("hidden");
      } else if (group.dataset.groupCategory === filterValue) {
        group.removeAttribute("hidden");
        // Hide the h3 since the filter pill already conveys the category
        const h3 = group.querySelector("h3");
        if (h3) h3.setAttribute("hidden", "");
      } else {
        group.setAttribute("hidden", "");
        const h3 = group.querySelector("h3");
        if (h3) h3.removeAttribute("hidden");
      }
    });

    // Restore h3 visibility when "All" is active
    if (filterValue === "all") {
      groups.forEach((group) => {
        const h3 = group.querySelector("h3");
        if (h3) h3.removeAttribute("hidden");
      });
    }

    // Announce to screen readers
    if (announcement) {
      const lang = getCurrentLanguage();
      const t = translations[lang] || translations.en;
      const showingText = t.filter_showing || "Showing";
      const projectsText = t.filter_projects || "projects";
      announcement.textContent = `${showingText} ${visibleCount} ${projectsText}`;
    }
  }

  // Click handler
  filterBar.addEventListener("click", (e) => {
    const pill = e.target.closest(".project-filter-pill");
    if (!pill) return;
    applyFilter(pill.dataset.filter);
    pill.focus();
  });

  // Arrow-key roving focus within filter bar
  filterBar.addEventListener("keydown", (e) => {
    const isRTL = document.documentElement.dir === "rtl";
    const prev = isRTL ? "ArrowRight" : "ArrowLeft";
    const next = isRTL ? "ArrowLeft" : "ArrowRight";

    if (e.key !== prev && e.key !== next && e.key !== "Home" && e.key !== "End") return;

    e.preventDefault();
    const idx = pills.indexOf(document.activeElement);
    let target;

    if (e.key === next) target = pills[(idx + 1) % pills.length];
    else if (e.key === prev) target = pills[(idx - 1 + pills.length) % pills.length];
    else if (e.key === "Home") target = pills[0];
    else if (e.key === "End") target = pills[pills.length - 1];

    if (target) {
      target.focus();
      applyFilter(target.dataset.filter);
    }
  });
}

/**
 * Expandable & Collapsible Projects
 * ─────────────────────────────────────────────────────────────────────
 * Allows users to collapse/expand each project card:
 *  - Click on .project-toggle button or .project-header
 *  - Updates aria-expanded ("true" | "false")
 *  - Updates aria-label ("Collapse [Title]" / "Expand [Title]")
 *  - Animates smooth height collapse via CSS grid
 *  - Keyboard accessible via the toggle button
 */
function initProjectCollapses() {
  const articles = document.querySelectorAll(".projects-panel article[data-category]");
  if (!articles.length) return;

  articles.forEach((article) => {
    const header = article.querySelector(".project-header");
    const toggle = article.querySelector(".project-toggle");
    const titleEl = article.querySelector("h4");
    if (!header || !toggle) return;

    function updateAriaLabel(isCollapsed) {
      const lang = getCurrentLanguage();
      const t = translations[lang] || translations.en;
      const actionPrefix = isCollapsed ? (t.expand_project || "Expand") : (t.collapse_project || "Collapse");
      const titleText = titleEl ? titleEl.textContent.trim() : "project";
      toggle.setAttribute("aria-label", `${actionPrefix} ${titleText}`);
    }

    function toggleCollapse(event) {
      // Prevent toggle if clicking on a link or button inside header other than the toggle
      if (event.target.closest("a, .btn, .copy-button") && !event.target.closest(".project-toggle")) {
        return;
      }

      const isCurrentlyCollapsed = article.classList.contains("is-collapsed");
      const nextCollapsed = !isCurrentlyCollapsed;

      article.classList.toggle("is-collapsed", nextCollapsed);
      toggle.setAttribute("aria-expanded", nextCollapsed ? "false" : "true");
      updateAriaLabel(nextCollapsed);
    }

    header.addEventListener("click", toggleCollapse);
  });
}

function initialize() {
  enhanceLinkedCards();
  bindCopyButtons();
  initProjectFilters();
  initProjectCollapses();

  if (document.body.dataset.localized === "false" && savedLang === "ar") {
    const languageNote = document.createElement("p");
    languageNote.className = "case-language-note";
    languageNote.lang = "ar";
    languageNote.dir = "rtl";
    languageNote.textContent = "دراسة الحالة متاحة حالياً باللغة الإنجليزية.";
    document.querySelector(".case-study-breadcrumbs")?.after(languageNote);
  }

  setTheme(savedTheme || (prefersDark ? "dark" : "light"));
  setContrast(savedContrast);
  const pageLanguage = document.body.dataset.localized === "false" ? "en" : savedLang;
  setLanguage(pageLanguage, document.body.dataset.localized !== "false");
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

document.querySelectorAll("[data-print-resume]").forEach((button) => {
  button.addEventListener("click", () => window.print());
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

/* Reveal content once as it enters the viewport. */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.panel, .li-experience-group, .featured article, .case-study-section');

  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    revealElements.forEach((element) => element.classList.add("reveal", "active"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("active");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -32px" });

  revealElements.forEach((element) => {
    element.classList.add("reveal");
    observer.observe(element);
  });
}

/* ── Interactive Image Lightbox Modal ── */
function initImageLightbox() {
  let lightbox = null;
  let lightboxImg = null;
  let lightboxCaption = null;
  let closeBtn = null;
  let lastActiveElement = null;

  function ensureLightbox() {
    if (lightbox) return;
    lightbox = document.createElement("div");
    lightbox.id = "image-lightbox";
    lightbox.className = "image-lightbox";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Image preview");
    lightbox.innerHTML = `
      <div class="lightbox-content">
        <button class="lightbox-close-btn" type="button" aria-label="Close image preview">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="lightbox-img-wrapper">
          <img class="lightbox-img" alt="" />
        </div>
        <p class="lightbox-caption"></p>
      </div>
    `;
    document.body.appendChild(lightbox);
    lightboxImg = lightbox.querySelector(".lightbox-img");
    lightboxCaption = lightbox.querySelector(".lightbox-caption");
    closeBtn = lightbox.querySelector(".lightbox-close-btn");

    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox || e.target.classList.contains("lightbox-img-wrapper")) {
        closeLightbox();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox && lightbox.classList.contains("is-open")) {
        closeLightbox();
      }
    });
  }

  function openLightbox(imgSrc, altText, captionText) {
    ensureLightbox();
    lastActiveElement = document.activeElement;
    lightboxImg.src = imgSrc;
    lightboxImg.alt = altText || "";
    lightboxCaption.textContent = captionText || altText || "";
    lightbox.classList.add("is-open");
    closeBtn.focus();
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains("is-open")) return;
    lightbox.classList.remove("is-open");
    if (lightboxImg) lightboxImg.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";
    document.body.style.overflow = "";
    if (lastActiveElement && typeof lastActiveElement.focus === "function") {
      lastActiveElement.focus();
    }
  }

  // Attach to case study images
  const targetImages = document.querySelectorAll(".case-study-image, .case-showcase-wrapper img");
  targetImages.forEach((img) => {
    img.setAttribute("tabindex", "0");
    img.setAttribute("role", "button");
    img.setAttribute("aria-label", `Zoom into ${img.alt || "image preview"}`);

    const handleOpen = () => {
      const caption = img.closest("figure")?.querySelector("figcaption")?.textContent || img.alt;
      openLightbox(img.src, img.alt, caption);
    };

    img.addEventListener("click", handleOpen);
    img.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpen();
      }
    });
  });
}

/* ── Interactive In-Page Live Embed Viewer ── */
function initLiveEmbedViewer() {
  const toggleButtons = document.querySelectorAll("[data-toggle-embed]");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const container = document.getElementById("live-embed-viewer");
      if (!container) return;

      const isOpen = container.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
      btn.querySelector("span").textContent = isOpen ? "Hide Interactive Preview" : "Interactive Preview";

      if (isOpen) {
        const iframe = container.querySelector(".live-embed-iframe");
        if (iframe && iframe.getAttribute("src") === "about:blank" && iframe.dataset.src) {
          iframe.src = iframe.dataset.src;
        }
        container.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });

  const deviceButtons = document.querySelectorAll("[data-set-device]");
  deviceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const frameContainer = document.querySelector(".live-embed-frame-container");
      if (!frameContainer) return;

      deviceButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const device = btn.dataset.setDevice;
      frameContainer.dataset.device = device;
    });
  });
}

/* ── Skill Badge to Project Cross-Filtering ── */
function initSkillProjectLinks() {
  const skillPills = document.querySelectorAll(".pills span[data-skill-filter]");
  const projectPanel = document.getElementById("projects");
  if (!skillPills.length || !projectPanel) return;

  skillPills.forEach((pill) => {
    const handleSkillClick = () => {
      const filterCategory = pill.dataset.skillFilter;
      const filterBtn = document.querySelector(`.project-filter-pill[data-filter="${filterCategory}"]`);
      if (filterBtn) {
        filterBtn.click();
      }

      projectPanel.scrollIntoView({ behavior: "smooth", block: "start" });

      // Pulse all matching category articles
      const articles = document.querySelectorAll(`.featured article[data-category="${filterCategory}"]`);
      articles.forEach((art) => {
        art.classList.remove("skill-highlighted");
        void art.offsetWidth; // Trigger reflow
        art.classList.add("skill-highlighted");
        setTimeout(() => art.classList.remove("skill-highlighted"), 3000);
      });
    };

    pill.addEventListener("click", handleSkillClick);
    pill.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSkillClick();
      }
    });
  });
}

initScrollReveal();
initImageLightbox();
initLiveEmbedViewer();
initSkillProjectLinks();
