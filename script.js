const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const langToggle = document.querySelector(".lang-toggle");
const contrastToggle = document.querySelector(".contrast-toggle");

const savedTheme = localStorage.getItem("resume-theme");
const savedLang = localStorage.getItem("resume-lang") || "en";
const savedContrast = localStorage.getItem("resume-contrast") || "normal";
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const toast = document.createElement("div");
let toastTimer;

toast.className = "copy-toast";
toast.setAttribute("role", "status");
toast.setAttribute("aria-live", "polite");
document.body.appendChild(toast);

const translations = {
  ar: {
    skip_link: "تجاوز إلى المحتوى الرئيسي",
    name: "أحمد مهدي",
    title: "مصمم تجربة المستخدم ومحلل بيانات",
    exp_tag: "خبرة +4 سنوات",
    ux_tag: "تصميم تجربة المستخدم",
    data_tag: "تحليل البيانات",
    sect_about: "نبذة عني",
    about_text: "مصمم تجربة مستخدم ومحلل بيانات بخبرة تزيد عن 4 سنوات في تحويل احتياجات المستخدمين والأعمال إلى لوحات معلومات تفاعلية وتجارب رقمية متمحورة حول المستخدم. ماهر في أبحاث المستخدم، بنية المعلومات، سرد البيانات، وتصميم الواجهات سهلة الوصول باستخدام Excel و Power BI و Tableau و SQL و Python.",
    sect_certs: "الشهادات المهنية",
    cert1: "تحليل البيانات من جوجل (Google Data Analytics)",
    cert2: "تحليل ذكاء الأعمال Tableau (Tableau Business Intelligence Analyst)",
    cert3: "مهارات Excel لتحليل البيانات والتصوير المرئي",
    cert4: "مهارات Excel للأعمال",
    cert5: "تصميم تجربة المستخدم من جوجل (Google UX Design)",
    sect_skills: "المهارات",
    skills_ux_header: "تصميم تجربة المستخدم",
    skills_data_header: "تحليل وتصوير البيانات",
    skill_ux1: "تصميم التفاعل",
    skill_ux2: "بنية المعلومات",
    skill_ux3: "أبحاث المستخدمين",
    skill_ux4: "اختبار سهولة الاستخدام",
    skill_ux5: "التخطيط الهيكلي (Wireframing)",
    skill_ux6: "بناء النماذج الأولية",
    skill_ux7: "فيجما (Figma)",
    skill_ux8: "أنظمة التصميم",
    skill_ux9: "سهولة الوصول (a11y)",
    skill_data1: "مايكروسوفت إكسل (متقدم)",
    skill_data2: "باور بي آي (Power BI)",
    skill_data3: "تابلو (Tableau)",
    skill_data4: "بايثون (Python)",
    skill_data5: "لغة الاستعلامات (SQL)",
    skill_data6: "تصميم لوحات المعلومات",
    skill_data7: "سرد البيانات قصصياً",
    skill_data8: "تحليل مؤشرات الأداء (KPI)",
    sect_projects: "المشاريع",
    proj_data_header: "مشاريع تحليل وتصوير البيانات",
    proj_data1_title: "مستكشف ليجو المعتمد على البيانات",
    proj_data1_desc: "تجربة تفاعلية لتصور البيانات باستخدام Tableau تساعد المستخدمين على استكشاف مجموعات LEGO حسب الموضوع، العمر، السعر، وعدد القطع.",
    proj_data2_title: "لوحة معلومات أداء المبيعات",
    proj_data2_desc: "لوحة معلومات لمبيعات علاقات العملاء (CRM) تم بناؤها في Google Sheets لتتبع أداء الفريق الربع سنوي عبر التصور المعتمد على الرسوم البيانية.",
    proj_ux_header: "مشاريع تجربة المستخدم",
    proj_ux1_title: "الموارد البشرية الإصدار الثاني (HR V2)",
    proj_ux1_desc: "تطبيق خدمة ذاتية للموارد البشرية مستجيب وآمن للخصوصية، تم بناؤه باستخدام React و TypeScript و Tailwind CSS. يسهل طلبات الإجازات والحضور وإدارة الأدوار.",
    proj_ux2_title: "مركز التحكم بمطار القاهرة الدولي",
    proj_ux2_desc: "منصة ذكية لمراقبة المطارات تستكشف لوحات المعلومات التفاعلية وتتبع المرافق وعمليات التوأم الرقمي لفرق إدارة المطار.",
    proj_ux3_title: "أداة الموظفين (إعادة تصميم فيجما)",
    proj_ux3_desc: "إعادة تصميم أداة موارد بشرية داخلية في Figma، مما يوفر منصة أكثر وضوحاً لطلبات الإجازات والمرضيات والمهمات.",
    sect_jobs: "الخبرات المهنية",
    job1_title: "مصمم تجربة المستخدم",
    job1_date: "يناير 2023 - الحالي",
    job1_company: "أدفانسيس للحلول البرمجية",
    job1_b1: "إجراء أبحاث المستخدمين واختبارات سهولة الاستخدام لترجمة المتطلبات المعقدة إلى مخططات هيكلية ونماذج تفاعلية سهلة الوصول في Figma.",
    job1_b2: "تطوير وصيانة نظام تصميم معتمد على المكونات (Component-driven) مما سرع عمليات تسليم التصميم للمطورين بنسبة 25%.",
    job1_b3: "التعاون مع مديري المنتجات والمهندسين لضمان توافق التنفيذ البرمجي مع دقة التصاميم ومعايير سهولة الوصول WCAG.",
    job2_title: "مصمم تعليمي",
    job2_date: "يوليو 2018 - يناير 2023",
    job2_company: "شنايدر إلكتريك",
    job2_b1: "تصميم أنشطة تعليمية إلكترونية ومواد تفاعلية وجذابة زادت معدلات إكمال الدورات التدريبية بنسبة 30% وعززت تفاعل المتدربين.",
    job2_b2: "إجراء أبحاث المستخدمين على مسارات التعلم ورحلات المستخدم، وإعادة تصميم واجهات الدورات لتتوافق مع معايير سهولة الاستخدام الحديثة.",
    job2_b3: "التعاون مع خبراء موضوع العمل لترجمة المحتوى التقني المعقد إلى صيغ وحلول تقديم رقمية سهلة الوصول ومتمحورة حول المستخدم.",
    sect_edu: "التعليم",
    edu1_title: "دبلوم في تقنيات التعليم وتكنولوجيا المعلومات",
    edu1_date: "سبتمبر 2016 - يونيو 2017",
    edu1_school: "معهد تكنولوجيا المعلومات (ITI)",
    edu2_title: "بكالوريوس في الإذاعة والتلفزيون",
    edu2_date: "سبتمبر 2009 - يونيو 2013",
    edu2_school: "جامعة المنوفية",
    toast_copied: "تم النسخ",
    toast_failed: "فشل النسخ"
  },
  en: {
    skip_link: "Skip to main content",
    name: "Ahmed Mahdy",
    title: "UX Designer & Data Analyst",
    exp_tag: "4+ years experience",
    ux_tag: "UX Design",
    data_tag: "Data Analytics",
    sect_about: "About Me",
    about_text: "UX Designer & Data Analyst with 4+ years of experience turning user and business needs into decision-ready dashboards and user-centered digital experiences. Skilled in user research, information architecture, data storytelling, visualization, and accessible interface design with Excel, Power BI, Tableau, SQL, and Python.",
    sect_certs: "Certifications",
    cert1: "Google Data Analytics",
    cert2: "Tableau Business Intelligence Analyst",
    cert3: "Excel Skills for Data Analytics and Visualization",
    cert4: "Excel Skills for Business",
    cert5: "Google UX Design",
    sect_skills: "Skills",
    skills_ux_header: "Core UX & Design",
    skills_data_header: "Data Analysis & Visualization",
    skill_ux1: "Interaction Design",
    skill_ux2: "Information Architecture",
    skill_ux3: "User Research",
    skill_ux4: "Usability Testing",
    skill_ux5: "Wireframing",
    skill_ux6: "Prototyping",
    skill_ux7: "Figma",
    skill_ux8: "Design Systems",
    skill_ux9: "Accessibility",
    skill_data1: "Microsoft Excel (Advanced)",
    skill_data2: "Power BI",
    skill_data3: "Tableau",
    skill_data4: "Python",
    skill_data5: "SQL",
    skill_data6: "Dashboard Design",
    skill_data7: "Data Storytelling",
    skill_data8: "KPI Analysis",
    sect_projects: "Projects",
    proj_data_header: "Data Analysis & Visualization Projects",
    proj_data1_title: "A Data-Driven LEGO Explorer",
    proj_data1_desc: "An interactive Tableau visualization experience that helps users explore LEGO sets by theme, age, price, and set count.",
    proj_data2_title: "Sales Performance Dashboard",
    proj_data2_desc: "CRM sales dashboard built in Google Sheets for tracking quarterly team performance through chart-based visualization.",
    proj_ux_header: "UX Projects",
    proj_ux1_title: "Human Resources V2",
    proj_ux1_desc: "A responsive, privacy-safe HR self-service application built with React, TypeScript, and Tailwind CSS. Streamlines leave requests, attendance, and role management.",
    proj_ux2_title: "Cairo International Airport - Command Hub",
    proj_ux2_desc: "A smart airport monitoring platform exploring interactive dashboards, facility tracking, and Digital Twin operations for airport command teams.",
    proj_ux3_title: "People Tool (Figma Redesign)",
    proj_ux3_desc: "Redesigned an internal HR tool in Figma, delivering a clearer platform for vacation, sick leave, and mission requests.",
    sect_jobs: "Employment",
    job1_title: "User Experience Designer",
    job1_date: "Jan 2023 - Present",
    job1_company: "Advansys IS",
    job1_b1: "Conducted user research and usability testing to translate complex requirements into intuitive, accessible wireframes and prototypes in Figma.",
    job1_b2: "Developed and maintained a component-driven design system, accelerating cross-functional design-to-development handoffs by 25%.",
    job1_b3: "Collaborated with product managers and engineers to ensure implementation aligned with design fidelity and WCAG accessibility standards.",
    job2_title: "Instructional Designer",
    job2_date: "Jul 2018 - Jan 2023",
    job2_company: "Schneider Electric",
    job2_b1: "Designed interactive e-learning modules and media assets, increasing course completion rates by 30% and boosting user engagement.",
    job2_b2: "Conducted user research on learning paths and user journeys, redesigning course interfaces to align with modern usability standards.",
    job2_b3: "Collaborated with subject matter experts to translate technical content into accessible, user-centered digital training solutions.",
    sect_edu: "Education",
    edu1_title: "Diploma of Education/Instructional Technology",
    edu1_date: "Sep 2016 - Jun 2017",
    edu1_school: "Information Technology Institute (ITI)",
    edu2_title: "Bachelor's degree, Radio and Television",
    edu2_date: "Sep 2009 - Jun 2013",
    edu2_school: "Minufiya University",
    toast_copied: "Copied",
    toast_failed: "Copy failed"
  }
};

function setTheme(theme) {
  root.dataset.theme = theme;
  localStorage.setItem("resume-theme", theme);
  const isDark = theme === "dark";
  themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  themeToggle.querySelector("span").innerHTML = isDark
    ? '<svg aria-hidden="true"><use href="#icon-sun"></use></svg>'
    : '<svg aria-hidden="true"><use href="#icon-moon"></use></svg>';
}

function setContrast(contrast) {
  root.dataset.contrast = contrast;
  localStorage.setItem("resume-contrast", contrast);
  const isHigh = contrast === "high";
  contrastToggle.setAttribute("aria-label", isHigh ? "Switch to normal contrast" : "Switch to high contrast");
  contrastToggle.textContent = isHigh ? "NC" : "HC";
  contrastToggle.classList.toggle("active", isHigh);
}

function setLanguage(lang) {
  root.setAttribute("lang", lang);
  root.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  localStorage.setItem("resume-lang", lang);
  langToggle.textContent = lang === "ar" ? "EN" : "AR";
  langToggle.setAttribute("aria-label", lang === "ar" ? "Switch to English" : "Switch to Arabic");

  // Translate all tagged nodes
  document.querySelectorAll("[data-translate]").forEach((node) => {
    const key = node.dataset.translate;
    if (translations[lang] && translations[lang][key]) {
      node.textContent = translations[lang][key];
    }
  });

  // Re-run standard labels on external links that depend on text content
  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const label = link.textContent.replace(" (opens external site)", "").replace(" (يفتح في موقع خارجي)", "").trim();
    if (lang === "ar") {
      link.setAttribute("aria-label", `${label} (يفتح في موقع خارجي)`);
      link.setAttribute("title", "يفتح في موقع خارجي");
    } else {
      link.setAttribute("aria-label", `${label} (opens external site)`);
      link.setAttribute("title", "Opens external site");
    }
  });
}

async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
  } else {
    throw new Error("Clipboard API not available");
  }
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

function makeCopyButton(value, label) {
  const button = document.createElement("button");
  button.className = "copy-button";
  button.type = "button";
  button.dataset.copy = value;
  button.setAttribute("aria-label", label);
  button.innerHTML = '<span aria-hidden="true"></span>';
  return button;
}

// Initial Setups
setTheme(savedTheme || (prefersDark ? "dark" : "light"));
setContrast(savedContrast);
setLanguage(savedLang);

// Event Listeners
themeToggle.addEventListener("click", () => {
  setTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

contrastToggle.addEventListener("click", () => {
  setContrast(root.dataset.contrast === "high" ? "normal" : "high");
});

langToggle.addEventListener("click", () => {
  setLanguage(root.getAttribute("lang") === "ar" ? "en" : "ar");
});

// Dynamic Button setups
document.querySelectorAll(".compact-list a, .featured h4 a").forEach((link) => {
  const copyButton = makeCopyButton(link.href, `Copy ${link.textContent.trim()} link`);
  const container = link.closest("li, article");
  container.appendChild(copyButton);
  container.addEventListener("click", (event) => {
    if (event.target.closest("button") || event.target.closest("a")) return;
    link.click();
  });
});

document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async (event) => {
    event.stopPropagation();
    const currentLang = root.getAttribute("lang") || "en";
    try {
      await copyText(button.dataset.copy);
      showToast(translations[currentLang].toast_copied);
    } catch {
      showToast(translations[currentLang].toast_failed);
    }
  });
});
